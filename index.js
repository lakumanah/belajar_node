import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { withClient } from './db.js';
import wismaRoutes from './routes/wisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testKoneksi() {
  try {
    const result = await withClient((client) => client.query('SELECT NOW()'));
    return { success: true, now: result.rows[0].now };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const app = express();

app.use(express.json());
app.use('/api/wisma', wismaRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', async (req, res) => {
  try {
    const result = await testKoneksi();
    if (result.success) {
      res.json({
        message: 'Berhasil terhubung ke database Neon Postgres!',
        now: result.now,
      });
    } else {
      res.status(500).json({
        message: 'Gagal terhubung ke database',
        error: result.error,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Gagal terhubung ke database',
      error: err.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  if (process.argv.includes('--serve')) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server berjalan di http://localhost:${port}`);
    });
  } else {
    const result = await testKoneksi();
    if (result.success) {
      console.log('✅ Berhasil terhubung ke database Neon Postgres!');
      console.log('Waktu database saat ini:', result.now);
    } else {
      console.error('❌ Gagal terhubung ke database:', result.error);
      process.exit(1);
    }
  }
}

export default app;
