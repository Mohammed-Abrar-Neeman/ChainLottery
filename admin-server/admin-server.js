const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Multer setup for image uploads
const imagesDir = path.join(__dirname, 'public', 'images');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'));
  }
});

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

// POST /api/config - update config.json
app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// POST /api/upload - upload an image
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 10MB allowed.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/images/${req.file.filename}` });
  });
});

// DELETE /api/images/:filename - delete an image
app.delete('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  const filePath = path.join(imagesDir, filename);
  fs.unlink(filePath, err => {
    if (err && err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    } else if (err) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.json({ success: true });
  });
});

// GET /api/images - list all images
app.get('/api/images', (req, res) => {
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