import { sql } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  try {
    const {
      author_id = null,
      media_type = 'video',
      title,
      description = null,
      category = null,
      duration_seconds = null,
      source = 'external',
      source_url = null,
      thumbnail_url = null,
      storage_url = null,
      mux_asset_id = null,
      mux_playback_id = null,
      status = 'ready'
    } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'O campo title é obrigatório.'
      });
    }

    const inserted = await sql`
      INSERT INTO media (
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
        status
      ) VALUES (
        ${author_id},
        ${media_type},
        ${title.trim()},
        ${description},
        ${category},
        ${duration_seconds},
        ${source},
        ${source_url},
        ${thumbnail_url},
        ${storage_url},
        ${mux_asset_id},
        ${mux_playback_id},
        ${status}
      )
      RETURNING *
    `;

    return res.status(201).json({
      ok: true,
      media: inserted[0]
    });
  } catch (error) {
    console.error('Erro ao criar publicação:', error);

    return res.status(500).json({
      ok: false,
      error: 'Não foi possível criar a publicação.'
    });
  }
}
