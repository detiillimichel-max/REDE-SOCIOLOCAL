const MUX_API_BASE = 'https://api.mux.com/video/v1';

function obterAuthorization() {
  const tokenId = process.env.REDE_MUX_TOKEN_ID;
  const tokenSecret = process.env.REDE_MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('Credenciais do Mux não configuradas na Vercel.');
  }

  return Buffer
    .from(`${tokenId}:${tokenSecret}`)
    .toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido. Use GET.'
    });
  }

  const uploadId = req.query?.upload_id;

  if (!uploadId || typeof uploadId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'upload_id é obrigatório.'
    });
  }

  try {
    const response = await fetch(
      `${MUX_API_BASE}/uploads/${encodeURIComponent(uploadId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${obterAuthorization()}`,
          Accept: 'application/json'
        }
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error:
          data?.error?.messages?.join('; ') ||
          data?.error?.message ||
          'Erro ao consultar o upload no Mux.'
      });
    }

    const upload = data?.data || data;

    return res.status(200).json({
      ok: true,
      upload_id: upload.id || uploadId,
      status: upload.status || 'waiting',
      asset_id: upload.asset_id || null,
      ready: Boolean(upload.asset_id)
    });
  } catch (error) {
    console.error('Erro ao consultar upload Mux:', error);

    return res.status(500).json({
      ok: false,
      error: error?.message || 'Não foi possível consultar o Mux.'
    });
  }
}
