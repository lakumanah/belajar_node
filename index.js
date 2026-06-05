const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on Vercel' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
