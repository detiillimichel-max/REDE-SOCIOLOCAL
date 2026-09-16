export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  const tokenId = process.env.REDE_MUX_TOKEN_ID;
  const tokenSecret = process.env.REDE_MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.error("Credenciais do Mux não configuradas.");

    return res.status(500).json({
      error: "Integração Mux não configurada no servidor.",
    });
  }

  try {
    const authorization = Buffer.from(
      `${tokenId}:${tokenSecret}`
    ).toString("base64");

    const response = await fetch(
      "https://api.mux.com/video/v1/uploads",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_asset_settings: {
            playback_policy: ["public"],
            video_quality: "basic",
          },
          cors_origin: "*",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro ao criar upload no Mux:", data);

      return res.status(response.status).json({
        error: "Não foi possível criar o upload no Mux.",
      });
    }

    return res.status(200).json({
      uploadId: data.data.id,
      uploadUrl: data.data.url,
      status: data.data.status,
    });
  } catch (error) {
    console.error("Erro interno no endpoint Mux:", error);

    return res.status(500).json({
      error: "Erro interno ao preparar o upload.",
    });
  }
}
