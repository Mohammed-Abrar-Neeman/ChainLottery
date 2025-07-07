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

// GET /api/images - list all images
app.get('/api/images', (req, res) => {
  const imagesDir = path.join(__dirname, 'public', 'images');
  fs.readdir(imagesDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list images' });
    // Filter only image files
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    res.json(imageFiles);
  });
});

// Serve images statically
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
}); 