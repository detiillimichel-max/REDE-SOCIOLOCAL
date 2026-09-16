import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['video/*', 'image/*'],
        maximumSizeInBytes: 100 * 1024 * 1024,
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
      error: 'Não foi possível preparar o upload do arquivo.'
    });
  }
}
