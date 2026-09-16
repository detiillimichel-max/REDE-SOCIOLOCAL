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
        1 AS database_check,
        current_database() AS database,
        NOW() AS server_time
    `;

    return response.status(200).json({
      ok: true,
      status: 'healthy',
      database: rows[0].database,
      databaseCheck: rows[0].database_check === 1,
      serverTime: rows[0].server_time
    });
  } catch (error) {
    console.error('Erro no health check do Neon:', error);

    return response.status(500).json({
      ok: false,
      status: 'unhealthy',
      error: 'Não foi possível verificar a saúde do banco de dados.'
    });
  }
}
