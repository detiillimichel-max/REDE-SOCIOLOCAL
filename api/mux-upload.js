const MUX_API_BASE = 'https://api.mux.com/video/v1';

function obterCredenciais() {
  const tokenId = process.env.REDE_MUX_TOKEN_ID;
  const tokenSecret = process.env.REDE_MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('Credenciais do Mux não configuradas na Vercel.');
  }

  return Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
}

async function muxRequest(path, options = {}) {
  const authorization = `Basic ${obterCredenciais()}`;

  const response = await fetch(`${MUX_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.messages?.join('; ') ||
      payload?.error?.message ||
      payload?.message ||
      `Mux respondeu com HTTP ${response.status}.`;
    throw new Error(message);
  }

  return payload?.data || payload;
}

export default async function handler(request, response) {
  if (!['POST', 'GET'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({
      ok: false,
      error: 'Método não permitido. Use GET ou POST.'
    });
  }

  try {
    if (request.method === 'POST') {
      const upload = await muxRequest('/uploads', {
        method: 'POST',
        body: JSON.stringify({
          cors_origin: '*',
          new_asset_settings: {
            playback_policy: ['public'],
            mp4_support: 'standard'
          }
        })
      });

      return response.status(201).json({
        ok: true,
        upload_id: upload.id,
        upload_url: upload.url,
        status: upload.status || 'waiting'
      });
    }

    const uploadId = request.query?.upload_id;

    if (!uploadId || typeof uploadId !== 'string') {
      return response.status(400).json({
        ok: false,
        error: 'O parâmetro upload_id é obrigatório.'
      });
    }

    const upload = await muxRequest(`/uploads/${encodeURIComponent(uploadId)}`);

    if (!upload.asset_id) {
      return response.status(200).json({
        ok: true,
        status: upload.status || 'waiting',
        ready: false
      });
    }

    const asset = await muxRequest(`/assets/${encodeURIComponent(upload.asset_id)}`);
    const playbackId = asset.playback_ids?.find((item) => item.policy === 'public')?.id ||
      asset.playback_ids?.[0]?.id ||
      null;

    return response.status(200).json({
      ok: true,
      ready: Boolean(playbackId),
      status: asset.status || upload.status || 'preparing',
      asset_id: asset.id || upload.asset_id,
      playback_id: playbackId,
      storage_url: playbackId
        ? `https://stream.mux.com/${playbackId}/medium.mp4`
        : null,
      thumbnail_url: playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
        : null
    });
  } catch (error) {
    console.error('Erro na integração com o Mux:', error);

    return response.status(500).json({
      ok: false,
      error: error?.message || 'Não foi possível comunicar com o Mux.'
    });
  }
}
