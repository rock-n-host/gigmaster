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
const SETLISTS_ROOT = path.join(LYRICS_ROOT, 'setlists');

if (!fs.existsSync(LYRICS_ROOT)) fs.mkdirSync(LYRICS_ROOT);
if (!fs.existsSync(METADATA_ROOT)) fs.mkdirSync(METADATA_ROOT);
if (!fs.existsSync(SETLISTS_ROOT)) fs.mkdirSync(SETLISTS_ROOT);

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
                    timeSignature: metadata.timeSignature || '-',
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
const watcher = chokidar.watch([LYRICS_ROOT, SETLISTS_ROOT], {
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
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// --- API: SONGS ---
app.get('/api/songs', (req, res) => res.json(songIndex));

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

// CREATE (POST)
app.post('/api/songs', (req, res) => {
    const { title, artist, bpm, timeSignature, key, genre, lyrics } = req.body;
    if (!title || !lyrics) return res.status(400).send('Title/Lyrics required');

    const filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.txt';
    const yamlFilename = filename.replace('.txt', '.yaml');

    try {
        fs.writeFileSync(path.join(LYRICS_ROOT, filename), lyrics);
        const metadata = { title, artist, bpm, timeSignature, key, genre };
        fs.writeFileSync(path.join(METADATA_ROOT, yamlFilename), yaml.dump(metadata));
        res.json({ success: true, id: filename });
    } catch (e) {
        res.status(500).send('Error saving files');
    }
});

// UPDATE (PUT)
app.put('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    const { title, artist, bpm, timeSignature, key, genre, lyrics } = req.body;
    
    // Security check
    const safeFilename = path.basename(id);
    const fullPath = path.join(LYRICS_ROOT, safeFilename);
    if (!fullPath.startsWith(LYRICS_ROOT) || !fs.existsSync(fullPath)) {
        return res.status(404).send('Song not found');
    }

    const yamlFilename = safeFilename.replace('.txt', '.yaml');
    
    try {
        // Update Content
        fs.writeFileSync(fullPath, lyrics);
        // Update Metadata
        const metadata = { title, artist, bpm, timeSignature, key, genre };
        fs.writeFileSync(path.join(METADATA_ROOT, yamlFilename), yaml.dump(metadata));
        
        res.json({ success: true });
        scanLibrary(); // Force refresh to update title in UI
    } catch (e) {
        res.status(500).send('Error updating files');
    }
});

// DELETE
app.delete('/api/songs/:id', (req, res) => {
    const { id } = req.params;
    const safeFilename = path.basename(id);
    const txtPath = path.join(LYRICS_ROOT, safeFilename);
    const yamlPath = path.join(METADATA_ROOT, safeFilename.replace('.txt', '.yaml'));

    try {
        if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
        if (fs.existsSync(yamlPath)) fs.unlinkSync(yamlPath);
        res.json({ success: true });
    } catch (e) {
        res.status(500).send('Error deleting files');
    }
});

// --- API: SETLISTS ---
app.get('/api/setlists', (req, res) => {
    try {
        const files = fs.readdirSync(SETLISTS_ROOT).filter(f => f.endsWith('.json'));
        const lists = files.map(f => {
            try {
                const content = JSON.parse(fs.readFileSync(path.join(SETLISTS_ROOT, f), 'utf8'));
                return { id: f, name: content.name, songs: content.songs || [] };
            } catch (e) { return null; }
        }).filter(Boolean);
        res.json(lists);
    } catch(e) { res.status(500).send(e.message); }
});

app.post('/api/setlists', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).send('Name required');
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.json';
    const filepath = path.join(SETLISTS_ROOT, id);
    
    if (fs.existsSync(filepath)) return res.status(400).send('Setlist exists');
    
    const newSetlist = { name, songs: [] };
    fs.writeFileSync(filepath, JSON.stringify(newSetlist, null, 2));
    res.json({ id, ...newSetlist });
});

app.put('/api/setlists/:id', (req, res) => {
    const { id } = req.params;
    const { songs } = req.body; 
    const filepath = path.join(SETLISTS_ROOT, id);
    if (!fs.existsSync(filepath)) return res.status(404).send('Not found');
    
    const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    content.songs = songs; 
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
    res.json(content);
});

app.delete('/api/setlists/:id', (req, res) => {
    const { id } = req.params;
    const filepath = path.join(SETLISTS_ROOT, id);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ success: true });
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
function broadcastUpdate() { wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify({ type: 'REFRESH' }))); }

server.listen(PORT, () => {
    console.log(`Gigmaster running on http://localhost:${PORT}`);
    scanLibrary();
});
