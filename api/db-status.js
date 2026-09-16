import { sql } from './db.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({
      ok: false,
      error: 'Método não permitido.'
    });
  }

  try {
    const rows = await sql`
      SELECT
        current_database() AS database,
        current_user AS user_name,
        NOW() AS server_time
    `;

    return response.status(200).json({
      ok: true,
      database: rows[0].database,
      user: rows[0].user_name,
      serverTime: rows[0].server_time
    });
  } catch (error) {
    console.error('Erro ao conectar ao Neon:', error);

    return response.status(500).json({
      ok: false,
      error: 'Não foi possível conectar ao banco de dados.'
    });
  }
}
