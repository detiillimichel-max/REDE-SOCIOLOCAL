import { handleUpload } from '@vercel/blob/client';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({
      ok: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  const token = process.env.REDE_SOCIOLOCAL_PUBLIC_READ_WRITE_TOKEN;

  if (!token) {
    console.error('Token do Blob público não encontrado.');
    return response.status(500).json({
      ok: false,
      error: 'Token do Blob público não configurado na Vercel.'
    });
  }

  try {
    const body = typeof request.body === 'string'
      ? JSON.parse(request.body)
      : (request.body || {});

    const jsonResponse = await handleUpload({
      body,
      request,
      token,

      onBeforeGenerateToken: async (pathname, clientPayload) => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/avif'
        ],
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({
          storage: 'rede-sociolocal-public',
          mediaType: 'image',
          pathname,
          clientPayload: clientPayload || null
        })
      }),

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload de foto concluído no Blob:', {
          url: blob?.url,
          tokenPayload
        });
      }
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Erro na Function api/blob-upload:', error);
    return response.status(400).json({
      ok: false,
      error: error?.message || 'Não foi possível preparar o upload da foto.'
    });
  }
}
