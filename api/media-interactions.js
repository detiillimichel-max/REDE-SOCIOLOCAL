import { sql } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método não permitido. Use POST.' });
  }

  try {
    const { media_id, user_id, interaction_type = 'like' } = req.body || {};

    if (!media_id || typeof media_id !== 'string') return res.status(400).json({ ok:false, error:'O campo media_id é obrigatório.' });
    if (!user_id || typeof user_id !== 'string') return res.status(400).json({ ok:false, error:'O campo user_id é obrigatório.' });
    if (interaction_type !== 'like') return res.status(400).json({ ok:false, error:'Esta rota aceita apenas interaction_type igual a like.' });

    const existing = await sql`
      SELECT id FROM media_interactions
      WHERE media_id = ${media_id} AND user_id = ${user_id} AND interaction_type = 'like'
      LIMIT 1
    `;

    if (existing.length > 0) {
      await sql`DELETE FROM media_interactions WHERE id = ${existing[0].id}`;
      return res.status(200).json({ ok:true, liked:false });
    }

    await sql`
      INSERT INTO media_interactions (media_id, user_id, interaction_type)
      VALUES (${media_id}, ${user_id}, 'like')
    `;

    return res.status(200).json({ ok:true, liked:true });
  } catch (error) {
    console.error('Erro ao alternar curtida:', error);
    return res.status(500).json({ ok:false, error:'Não foi possível atualizar a curtida.' });
  }
}
