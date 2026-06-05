import { Router } from 'express';
import { withClient } from '../db.js';

const router = Router();

const SELECT_COLUMNS = `
  id_wisma,
  provinsi,
  kabupaten_kota,
  kecamatan,
  kelurahan,
  dusun_kampung,
  rt,
  rw,
  nomor_wisma,
  latitude,
  longitude
`;

const REQUIRED_FIELDS = [
  'provinsi',
  'kabupaten_kota',
  'kecamatan',
  'kelurahan',
];

function parseId(id) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function validateWismaBody(body) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || String(body[field]).trim() === '') {
      errors.push(`${field} wajib diisi`);
    }
  }

  if (body.latitude != null && body.latitude !== '') {
    const latitude = Number(body.latitude);
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push('latitude harus antara -90 dan 90');
    }
  }

  if (body.longitude != null && body.longitude !== '') {
    const longitude = Number(body.longitude);
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push('longitude harus antara -180 dan 180');
    }
  }

  return errors;
}

function toWismaValues(body) {
  return [
    String(body.provinsi).trim(),
    String(body.kabupaten_kota).trim(),
    String(body.kecamatan).trim(),
    String(body.kelurahan).trim(),
    body.dusun_kampung ? String(body.dusun_kampung).trim() : null,
    body.rt ? String(body.rt).trim() : null,
    body.rw ? String(body.rw).trim() : null,
    body.nomor_wisma ? String(body.nomor_wisma).trim() : null,
    body.latitude != null && body.latitude !== '' ? Number(body.latitude) : null,
    body.longitude != null && body.longitude !== ''
      ? Number(body.longitude)
      : null,
  ];
}

router.get('/', async (req, res) => {
  try {
    const rows = await withClient((client) =>
      client.query(`SELECT ${SELECT_COLUMNS} FROM wisma ORDER BY id_wisma ASC`)
    );
    res.json({ data: rows.rows });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data wisma', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id_wisma tidak valid' });
  }

  try {
    const result = await withClient((client) =>
      client.query(`SELECT ${SELECT_COLUMNS} FROM wisma WHERE id_wisma = $1`, [id])
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Wisma tidak ditemukan' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data wisma', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const errors = validateWismaBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validasi gagal', errors });
  }

  const values = toWismaValues(req.body);

  try {
    const result = await withClient((client) =>
      client.query(
        `INSERT INTO wisma (
          provinsi, kabupaten_kota, kecamatan, kelurahan,
          dusun_kampung, rt, rw, nomor_wisma, latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING ${SELECT_COLUMNS}`,
        values
      )
    );

    res.status(201).json({
      message: 'Wisma berhasil ditambahkan',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan wisma', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id_wisma tidak valid' });
  }

  const errors = validateWismaBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validasi gagal', errors });
  }

  const values = [...toWismaValues(req.body), id];

  try {
    const result = await withClient((client) =>
      client.query(
        `UPDATE wisma SET
          provinsi = $1,
          kabupaten_kota = $2,
          kecamatan = $3,
          kelurahan = $4,
          dusun_kampung = $5,
          rt = $6,
          rw = $7,
          nomor_wisma = $8,
          latitude = $9,
          longitude = $10
        WHERE id_wisma = $11
        RETURNING ${SELECT_COLUMNS}`,
        values
      )
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Wisma tidak ditemukan' });
    }

    res.json({
      message: 'Wisma berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui wisma', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'id_wisma tidak valid' });
  }

  try {
    const result = await withClient((client) =>
      client.query('DELETE FROM wisma WHERE id_wisma = $1 RETURNING id_wisma', [id])
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Wisma tidak ditemukan' });
    }

    res.json({
      message: 'Wisma berhasil dihapus',
      data: { id_wisma: result.rows[0].id_wisma },
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus wisma', error: err.message });
  }
});

export default router;
