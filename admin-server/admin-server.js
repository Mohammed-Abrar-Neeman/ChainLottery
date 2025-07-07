const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());

// Path to config.json
const configPath = path.join(__dirname, 'public', 'config.json');

// GET /api/config
app.get('/api/config', (req, res) => {
  if (!fs.existsSync(configPath)) {
    return res.status(404).json({ error: 'Config not found' });
  }
  const data = fs.readFileSync(configPath, 'utf-8');
  res.status(200).json(JSON.parse(data));
});

// Serve images statically
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
}); 