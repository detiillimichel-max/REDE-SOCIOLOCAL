import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.NEON_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Variável de conexão do Neon não configurada.');
}

export const sql = neon(connectionString);
