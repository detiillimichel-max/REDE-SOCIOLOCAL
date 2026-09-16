import { handleUpload } from '@vercel/blob/client';

// O cliente @vercel/blob/client envia um JSON para solicitar o token.
// Mantemos o body parser habilitado para que req.body contenha esse evento.
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
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['video/*', 'image/*'],
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ pathname })
      }),
      onUploadCompleted: async () => {
        // O registro dos metadados é feito separadamente pelo frontend
        // através de /api/media-create.
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Erro ao preparar upload para o Vercel Blob:', error);

    return res.status(500).json({
      ok: false,
      error: error?.message || 'Não foi possível preparar o upload do arquivo.'
    });
  }
}
