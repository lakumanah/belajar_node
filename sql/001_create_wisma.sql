CREATE TABLE IF NOT EXISTS wisma (
  id_wisma SERIAL PRIMARY KEY,
  provinsi VARCHAR(100) NOT NULL,
  kabupaten_kota VARCHAR(100) NOT NULL,
  kecamatan VARCHAR(100) NOT NULL,
  kelurahan VARCHAR(100) NOT NULL,
  dusun_kampung VARCHAR(150),
  rt VARCHAR(5),
  rw VARCHAR(5),
  nomor_wisma VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  CONSTRAINT chk_wisma_latitude
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT chk_wisma_longitude
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);
