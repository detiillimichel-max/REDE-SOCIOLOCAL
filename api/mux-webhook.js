import crypto from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

function verifyMuxSignature(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatureParts = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.substring(3));

  if (!timestampPart || signatureParts.length === 0) {
    return false;
  }

  const timestamp = timestampPart.substring(2);
  const receivedTimestamp = Number(timestamp);

  if (!Number.isFinite(receivedTimestamp)) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const toleranceInSeconds = 300;

  if (
    Math.abs(currentTimestamp - receivedTimestamp) >
    toleranceInSeconds
  ) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return signatureParts.some((receivedSignature) => {
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  const webhookSecret = process.env.REDE_MUX_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("REDE_MUX_WEBHOOK_SECRET não configurado.");

    return res.status(500).json({
      error: "Webhook do Mux não configurado.",
    });
  }

  try {
    const rawBody = await readRawBody(req);
    const signatureHeader = req.headers["mux-signature"];

    const signatureIsValid = verifyMuxSignature(
      rawBody,
      signatureHeader,
      webhookSecret
    );

    if (!signatureIsValid) {
      console.warn("Assinatura inválida recebida do Mux.");

      return res.status(401).json({
        error: "Assinatura inválida.",
      });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventType = event.type;
    const eventData = event.data || {};

    console.log("Evento Mux recebido:", {
      type: eventType,
      id: event.id,
      objectId: eventData.id,
    });

    if (eventType === "video.asset.ready") {
      const playbackId =
        eventData.playback_ids?.[0]?.id || null;

      console.log("Vídeo pronto para reprodução:", {
        assetId: eventData.id,
        playbackId,
        duration: eventData.duration || null,
        status: eventData.status || null,
      });
    }

    if (eventType === "video.asset.errored") {
      console.error("Mux informou erro no processamento:", {
        assetId: eventData.id,
        errors: eventData.errors || null,
      });
    }

    return res.status(200).json({
      received: true,
      type: eventType,
    });
  } catch (error) {
    console.error("Erro ao processar webhook do Mux:", error);

    return res.status(400).json({
      error: "Webhook inválido.",
    });
  }
}
