import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { withClient } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sqlPath = path.join(__dirname, '../sql/001_create_wisma.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await withClient((client) => client.query(sql));
    console.log('✅ Tabel wisma berhasil dibuat.');
  } catch (err) {
    console.error('❌ Migrasi gagal:', err.message);
    process.exit(1);
  }
}

migrate();
