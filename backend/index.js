const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const cors = require('cors');
const multer = require('multer');

const LYRICS_DIR = process.env.LYRICS_DIR || path.join(__dirname, '..', 'lyrics');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

async function listSongs() {
  await fs.mkdir(LYRICS_DIR, { recursive: true });
  const files = await fs.readdir(LYRICS_DIR);
  const txts = files.filter(f => f.toLowerCase().endsWith('.txt'));
  const songs = [];
  for (const f of txts) {
    const base = f.slice(0, -4);
    const yamlPath = path.join(LYRICS_DIR, `${base}.yaml`);
    let meta = {};
    try {
      const y = await fs.readFile(yamlPath, 'utf8');
      meta = yaml.load(y) || {};
    } catch (e) {
      // no metadata file — OK
    }
    songs.push({
      filename: f,
      title: meta.title || base,
      band: meta.band || '',
      metadata: meta
    });
  }
  return songs;
}

// GET /api/songs?q=&band=
app.get('/api/songs', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const bandFilter = (req.query.band || '').toLowerCase();
    const songs = await listSongs();
    const filtered = songs.filter(s => {
      const matchQ =
        !q ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.band && s.band.toLowerCase().includes(q));
      const matchBand = !bandFilter || (s.band && s.band.toLowerCase().includes(bandFilter));
      return matchQ && matchBand;
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/song/:filename
app.get('/api/song/:filename', async (req, res) => {
  try {
    const fn = path.basename(req.params.filename);
    const txtPath = path.join(LYRICS_DIR, fn);
    const base = fn.endsWith('.txt') ? fn.slice(0, -4) : fn;
    const yamlPath = path.join(LYRICS_DIR, `${base}.yaml`);
    const lyrics = await fs.readFile(txtPath, 'utf8');
    let meta = {};
    try {
      const y = await fs.readFile(yamlPath, 'utf8');
      meta = yaml.load(y) || {};
    } catch (e) {}
    res.json({ filename: fn, lyrics, metadata: meta });
  } catch (err) {
    res.status(404).json({ error: 'Song not found' });
  }
});

// POST /api/song  (form-data or json)
app.post('/api/song', upload.none(), async (req, res) => {
  try {
    const body = req.body || req;
    const title = body.title || body.filename;
    if (!title) return res.status(400).json({ error: 'title or filename required' });
    const band = body.band || '';
    const lyrics = body.lyrics || '';
    const safeName = `${title}`.replace(/[\\/:"*?<>|]+/g, '_');
    const filename = `${safeName}.txt`;
    const filepath = path.join(LYRICS_DIR, filename);
    await fs.writeFile(filepath, lyrics, 'utf8');
    const meta = {
      title,
      band,
      genre: body.genre || '',
      release_date: body.release_date || '',
      tempo: body.tempo || '',
      key: body.key || '',
      notes: body.notes || ''
    };
    const yamlText = yaml.dump(meta);
    await fs.writeFile(path.join(LYRICS_DIR, `${safeName}.yaml`), yamlText, 'utf8');
    res.status(201).json({ filename, metadata: meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/metadata/:filename
app.put('/api/metadata/:filename', async (req, res) => {
  try {
    const fn = path.basename(req.params.filename);
    const base = fn.endsWith('.txt') ? fn.slice(0, -4) : fn;
    const meta = req.body || {};
    const yamlPath = path.join(LYRICS_DIR, `${base}.yaml`);
    const yamlText = yaml.dump(meta);
    await fs.writeFile(yamlPath, yamlText, 'utf8');
    res.json({ ok: true, metadata: meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Gigmaster backend listening on ${port}, lyrics dir: ${LYRICS_DIR}`);
});
