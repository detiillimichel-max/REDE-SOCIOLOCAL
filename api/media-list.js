import { sql } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido. Use GET.'
    });
  }

  try {
    const media = await sql`
      SELECT
        id,
        author_id,
        media_type,
        title,
        description,
        category,
        duration_seconds,
        source,
        source_url,
        thumbnail_url,
        storage_url,
        mux_asset_id,
        mux_playback_id,
        status,
        created_at,
        updated_at
      FROM media
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({
      ok: true,
      count: media.length,
      media
    });
  } catch (error) {
    console.error('Erro ao consultar a tabela media:', error);

    return res.status(500).json({
      ok: false,
      error: 'Não foi possível consultar os conteúdos.'
    });
  }
}
