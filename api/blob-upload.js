import { handleUpload } from '@vercel/blob/client';

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      ok: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  // Prioriza explicitamente o token do Blob público usado pelo projeto.
  // O token BLOB_READ_WRITE_TOKEN pode pertencer ao Blob antigo/privado.
  const token =
    process.env.REDE_SOCIOLOCAL_PUBLIC_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('Token do Blob público não encontrado.');

    return res.status(500).json({
      ok: false,
      error: 'Token do Blob público não configurado na Vercel.'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (!body || typeof body !== 'object' || !body.type) {
      return res.status(400).json({
        ok: false,
        error: 'Solicitação de token inválida: corpo JSON ausente ou incompleto.'
      });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      token,

      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/*'],
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({
          storage: 'rede-sociolocal-public',
          mediaType: 'image'
        })
      })
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Erro ao preparar upload para o Vercel Blob:', error);

    return res.status(500).json({
      ok: false,
      error: error?.message ||
        'Não foi possível preparar o upload do arquivo.'
    });
  }
}
