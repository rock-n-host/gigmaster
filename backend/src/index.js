const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const LYRICS_ROOT = path.resolve(__dirname, '../../lyrics');
const METADATA_ROOT = path.join(LYRICS_ROOT, 'properties');

if (!fs.existsSync(LYRICS_ROOT)) fs.mkdirSync(LYRICS_ROOT);
if (!fs.existsSync(METADATA_ROOT)) fs.mkdirSync(METADATA_ROOT);

// --- STATE MANAGEMENT ---
let songIndex = [];

function scanLibrary() {
    console.log('Scanning library...');
    try {
        const files = fs.readdirSync(LYRICS_ROOT);
        const songs = [];

        files.forEach(file => {
            if (path.extname(file) === '.txt') {
                const songId = file; 
                const metaPath = path.join(METADATA_ROOT, file.replace('.txt', '.yaml'));
                
                let metadata = {};
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = fs.readFileSync(metaPath, 'utf8');
                        metadata = yaml.load(metaContent);
                    } catch (e) {
                        console.error(`Error parsing YAML for ${file}`, e);
                    }
                }

                songs.push({
                    id: songId,
                    title: metadata.title || file.replace('.txt', ''),
                    artist: metadata.artist || 'Unknown Artist',
                    bpm: metadata.bpm || 0,
                    key: metadata.key || '-',
                    genre: metadata.genre || 'General',
                    duration: metadata.duration || 0
                });
            }
        });
        
        songIndex = songs;
        broadcastUpdate();
    } catch (err) {
        console.error("Scanning error:", err);
    }
}

// --- FILE WATCHER ---
const watcher = chokidar.watch(LYRICS_ROOT, {
    ignored: /(^|[\\/\\\\])\\../,
    persistent: true,
    depth: 1
});

watcher.on('add', () => scanLibrary())
       .on('unlink', () => scanLibrary())
       .on('change', () => scanLibrary());


// --- SERVER SETUP ---
app.use(cors());
app.use(express.json());

// 1. SERVE STATIC FRONTEND
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// 2. API: Get Songs
app.get('/api/songs', (req, res) => res.json(songIndex));

// 3. API: Get Lyric Content
app.get('/api/lyrics', (req, res) => {
    const filename = req.query.file;
    if (!filename) return res.status(400).send('Filename required');
    
    const safeFilename = path.basename(filename); 
    const fullPath = path.join(LYRICS_ROOT, safeFilename);

    if (!fullPath.startsWith(LYRICS_ROOT)) return res.status(403).send('Access Denied');

    fs.readFile(fullPath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('Song not found');
        res.send(data);
    });
});

// 4. API: Create/Update Song (NEW)
app.post('/api/songs', (req, res) => {
    const { title, artist, bpm, key, genre, lyrics } = req.body;
    
    if (!title || !lyrics) return res.status(400).send('Title and Lyrics are required');

    // Create a safe filename from title
    const filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.txt';
    const yamlFilename = filename.replace('.txt', '.yaml');

    const txtPath = path.join(LYRICS_ROOT, filename);
    const yamlPath = path.join(METADATA_ROOT, yamlFilename);

    // Write Files
    try {
        fs.writeFileSync(txtPath, lyrics);
        
        const metadata = { title, artist, bpm, key, genre };
        const yamlStr = yaml.dump(metadata);
        fs.writeFileSync(yamlPath, yamlStr);

        res.json({ success: true, id: filename });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error saving files');
    }
});

// Fallback
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const indexHtml = path.join(__dirname, '../../frontend/dist/index.html');
        if (fs.existsSync(indexHtml)) res.sendFile(indexHtml);
        else res.send('Build the frontend first.');
    }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastUpdate() {
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(JSON.stringify({ type: 'REFRESH' }));
    });
}

server.listen(PORT, () => {
    console.log(`Gigmaster v3 running on http://localhost:${PORT}`);
    scanLibrary();
});