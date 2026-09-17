import { sql } from './db.js';

const LIMITE = 20;

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok:false, error:'Método não permitido. Use GET ou POST.' });
  }

  try {
    if (req.method === 'POST') {
      const { media_id, author_id, content } = req.body || {};

      if (!media_id || typeof media_id !== 'string') return res.status(400).json({ ok:false, error:'O campo media_id é obrigatório.' });
      if (!author_id || typeof author_id !== 'string') return res.status(400).json({ ok:false, error:'O campo author_id é obrigatório.' });
      if (!content || typeof content !== 'string' || !content.trim()) return res.status(400).json({ ok:false, error:'O campo content é obrigatório.' });

      const inserted = await sql`
        INSERT INTO media_comments (media_id, author_id, content)
        VALUES (${media_id}, ${author_id}, ${content.trim()})
        RETURNING *
      `;

      return res.status(201).json({ ok:true, comment:inserted[0] });
    }

    const mediaId = req.query?.media_id;
    if (!mediaId || typeof mediaId !== 'string') return res.status(400).json({ ok:false, error:'O parâmetro media_id é obrigatório.' });

    const before = req.query?.before;
    let comments;

    if (before) {
      const beforeDate = new Date(before);
      if (Number.isNaN(beforeDate.getTime())) return res.status(400).json({ ok:false, error:'O parâmetro before precisa ser um timestamp válido.' });

      comments = await sql`
        SELECT * FROM media_comments
        WHERE media_id = ${mediaId} AND created_at < ${beforeDate.toISOString()}
        ORDER BY created_at DESC
        LIMIT ${LIMITE}
      `;
    } else {
      comments = await sql`
        SELECT * FROM media_comments
        WHERE media_id = ${mediaId}
        ORDER BY created_at DESC
        LIMIT ${LIMITE}
      `;
    }

    return res.status(200).json({
      ok:true,
      comments,
      next_before: comments.length === LIMITE ? comments[comments.length - 1].created_at : null
    });
  } catch (error) {
    console.error('Erro ao processar comentários:', error);
    return res.status(500).json({ ok:false, error:'Não foi possível processar os comentários.' });
  }
}
