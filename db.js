import pg from 'pg';

const { Client } = pg;

export function createClient() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL belum diatur di environment variables');
  }

  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function withClient(fn) {
  const client = createClient();

  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end();
  }
}
