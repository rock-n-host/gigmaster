"""<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { 
  Music, ListMusic, Sun, Moon, Search, Plus, 
  Play, Pause, ChevronLeft, Github 
} from 'lucide-vue-next';

// --- STATE ---
const view = ref('library'); // 'library', 'setlists', 'song', 'add'
const isDark = ref(true);
const songs = ref([]);
const searchQuery = ref('');
const selectedSong = ref(null);
const lyricsContent = ref('');

// Setlists (Placeholder Data)
const setlists = ref([
  { id: 1, name: 'Saturday Gig', songs: [] }
]);
const activeSetlist = ref(null);

// Add Song Form Data
const newSong = ref({ 
  title: '', artist: '', key: '', 
  bpm: '', genre: '', lyrics: '' 
});

// Auto Scroll State
const isScrolling = ref(false);
const scrollSpeed = ref(1);
let scrollInterval = null;

// --- ACTIONS ---

// Theme Toggle
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.body.classList.toggle('light-theme', !isDark.value);
};

// Navigation Helpers
const goHome = () => {
  view.value = 'library';
  selectedSong.value = null;
  stopScroll();
};

const goSetlists = () => {
  view.value = 'setlists';
  stopScroll();
};

const goAddSong = () => {
  view.value = 'add';
  stopScroll();
};

// Load a Song
const openSong = async (song) => {
  selectedSong.value = song;
  view.value = 'song';
  try {
    const res = await axios.get(`/api/lyrics?file=${song.id}`);
    lyricsContent.value = res.data;
  } catch (e) {
    lyricsContent.value = "Error loading lyrics.";
  }
};

// Save a New Song
const saveSong = async () => {
  try {
    await axios.post('/api/songs', newSong.value);
    alert('Song Added!');
    // Reset form
    newSong.value = { title: '', artist: '', key: '', bpm: '', genre: '', lyrics: '' };
    fetchLibrary();
    goHome();
  } catch (e) {
    alert('Error saving song');
  }
};

// Fetch Library from Backend
const fetchLibrary = async () => {
  try {
    const res = await axios.get('/api/songs');
    songs.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

// Computed Property for Search
const filteredSongs = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return songs.value.filter(s => 
    s.title.toLowerCase().includes(q) || 
    s.artist.toLowerCase().includes(q)
  );
});

// Scroll Logic
const toggleScroll = () => {
  if (isScrolling.value) stopScroll();
  else startScroll();
};

const startScroll = () => {
  isScrolling.value = true;
  scrollInterval = setInterval(() => {
    window.scrollBy(0, scrollSpeed.value);
  }, 50);
};

const stopScroll = () => {
  isScrolling.value = false;
  clearInterval(scrollInterval);
};

// Lifecycle Hooks & WebSocket
onMounted(() => {
  fetchLibrary();
  
  // Setup WebSocket for auto-refresh
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}`);
  
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'REFRESH') fetchLibrary();
  };
});
</script>

<template>
  <div class="app-shell" :class="{ 'dark': isDark, 'light': !isDark }">
    
    <!-- NAVBAR -->
    <nav class="navbar">
      <div class="nav-brand" @click="goHome">
        <img src="/logo.svg" alt="Gigmaster" class="brand-logo" />
        <span>Gigmaster</span>
      </div>
      <div class="nav-links">
        <a :class="{ active: view === 'library' }" @click="goHome">
          <Music size="18"/> Library
        </a>
        <a :class="{ active: view === 'setlists' }" @click="goSetlists">
          <ListMusic size="18"/> Setlists
        </a>
      </div>
      <div class="nav-actions">
        <button class="icon-btn" @click="toggleTheme">
          <Sun v-if="isDark" size="20" />
          <Moon v-else size="20" />
        </button>
      </div>
    </nav>

    <!-- MAIN CONTAINER -->
    <main class="container">
      
      <!-- VIEW: LIBRARY -->
      <div v-if="view === 'library'" class="view-library">
        <div class="toolbar">
          <div class="search-wrap">
            <Search class="search-icon" size="20"/>
            <input v-model="searchQuery" type="text" placeholder="Search songs..." />
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-primary" @click="goAddSong">
              <Plus size="18" /> Add Song
            </button>
          </div>
        </div>

        <div class="song-grid">
          <div 
            v-for="song in filteredSongs" 
            :key="song.id" 
            class="song-card" 
            @click="openSong(song)"
          >
            <div class="card-header">
              <span class="song-title">{{ song.title }}</span>
              <span class="badge key-badge" v-if="song.key !== '-'">{{ song.key }}</span>
            </div>
            <div class="song-artist">{{ song.artist }}</div>
            <div class="card-footer">
              <div class="meta-dot" v-if="song.bpm > 0">
                <div class="dot"></div> {{ song.bpm }} BPM
              </div>
              <div class="meta-dot" v-if="song.genre"> 
                • {{ song.genre }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW: SONG DETAILS -->
      <div v-if="view === 'song'" class="view-song">
        <div class="song-control-bar">
          <button class="btn btn-ghost" @click="goHome">
            <ChevronLeft /> Back
          </button>
          <div class="song-info-center">
            <h2>{{ selectedSong.title }}</h2>
            <span class="sub">
              {{ selectedSong.artist }} • {{ selectedSong.key }}
            </span>
          </div>
          <div class="scroll-controls">
            <input type="range" min="1" max="5" step="0.5" v-model="scrollSpeed">
            <button class="btn btn-primary circle" @click="toggleScroll">
              <Pause v-if="isScrolling" fill="currentColor" />
              <Play v-else fill="currentColor" />
            </button>
          </div>
        </div>
        <div class="lyrics-paper">
          <pre>{{ lyricsContent }}</pre>
        </div>
      </div>

      <!-- VIEW: ADD SONG -->
      <div v-if="view === 'add'" class="view-add">
        <h2>Add New Song</h2>
        <form @submit.prevent="saveSong" class="add-form">
          <div class="form-row">
            <input v-model="newSong.title" placeholder="Song Title (Required)" required />
            <input v-model="newSong.artist" placeholder="Artist" />
          </div>
          <div class="form-row three">
            <input v-model="newSong.key" placeholder="Key" />
            <input v-model="newSong.bpm" placeholder="BPM" type="number" />
            <input v-model="newSong.genre" placeholder="Genre" />
          </div>
          <textarea v-model="newSong.lyrics" placeholder="Lyrics..." required></textarea>
          <div class="form-actions">
            <button type="button" class="btn" @click="goHome">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Song</button>
          </div>
        </form>
      </div>

      <!-- VIEW: SETLISTS -->
      <div v-if="view === 'setlists'" class="view-setlists">
        <div class="empty-state">
          <ListMusic size="48" />
          <h3>Setlists coming soon</h3>
          <p>Version v4.0</p>
        </div>
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="app-footer">
      <div class="footer-content">
        <span class="version">Version 2025-11-23</span>
        <span class="divider">•</span>
        <a href="https://github.com/rock-n-host" target="_blank" class="brand-link">
          <Github size="14" /> rock-n-host
        </a>
      </div>
    </footer>
  </div>
</template>

<style>
/* --- VARIABLES --- */
:root {
  --bg: #0f172a;
  --card-bg: #1e293b;
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --border: #334155;
  --font-main: 'Inter', sans-serif;
  --font-mono: 'Courier New', monospace;
}

.light-theme {
  --bg: #f1f5f9;
  --card-bg: #ffffff;
  --text: #0f172a;
  --text-muted: #64748b;
  --primary: #4f46e5;
  --border: #e2e8f0;
}

/* --- BASE --- */
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-main);
  transition: background 0.3s;
}
pre {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* --- LAYOUT --- */
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.container { max-width: 1200px; margin: 0 auto; width: 100%; padding: 20px; flex: 1; }

/* --- NAVBAR --- */
.navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 30px; height: 70px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky; top: 0; z-index: 50;
}
.nav-brand {
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; font-size: 1.2rem; cursor: pointer;
}
.brand-logo { width: 36px; height: 36px; transition: transform 0.2s; }
.nav-brand:hover .brand-logo { transform: rotate(-5deg); }

.nav-links { display: flex; gap: 30px; }
.nav-links a {
  display: flex; align-items: center; gap: 8px;
  color: var(--text-muted); cursor: pointer;
  font-weight: 500; transition: 0.2s;
}
.nav-links a:hover, .nav-links a.active { color: var(--primary); }

.icon-btn { background: none; border: none; color: var(--text); cursor: pointer; padding: 5px; }

/* --- COMPONENTS --- */
.toolbar { display: flex; justify-content: space-between; margin-bottom: 30px; margin-top: 10px; }
.search-wrap { position: relative; width: 400px; }
.search-icon { position: absolute; left: 12px; top: 12px; color: var(--text-muted); }
.search-wrap input {
  width: 100%; padding: 12px 12px 12px 40px;
  border-radius: 8px; border: 1px solid var(--border);
  background: var(--card-bg); color: var(--text);
  font-size: 1rem; outline: none;
}
.search-wrap input:focus { border-color: var(--primary); }

.btn {
  padding: 10px 20px; border-radius: 8px; border: none;
  font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  font-family: inherit; transition: 0.2s;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-ghost { background: transparent; color: var(--text-muted); }
.btn-ghost:hover { color: var(--text); }
.btn.circle { padding: 0; width: 40px; height: 40px; justify-content: center; border-radius: 50%; }

/* --- CARDS --- */
.song-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.song-card {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.song-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
.song-title { font-weight: 700; font-size: 1.1rem; }
.song-artist { color: var(--primary); margin-bottom: 15px; font-weight: 500; }
.badge {
  background: #334155; color: #f8fafc;
  padding: 4px 8px; border-radius: 4px;
  font-size: 0.85rem; font-weight: 600;
}
.light-theme .badge { background: #e2e8f0; color: #475569; }
.card-footer { display: flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 0.9rem; }
.meta-dot { display: flex; align-items: center; gap: 6px; }
.dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

/* --- SONG DETAILS --- */
.song-control-bar {
  display: flex; justify-content: space-between; align-items: center;
  position: sticky; top: 70px; background: var(--bg);
  padding: 15px 0; border-bottom: 1px solid var(--border);
  margin-bottom: 20px; z-index: 40;
}
.song-info-center { text-align: center; }
.song-info-center h2 { margin: 0; font-size: 1.5rem; }
.song-info-center .sub { color: var(--primary); font-weight: 600; }
.scroll-controls { display: flex; align-items: center; gap: 15px; }
.lyrics-paper { padding: 0 0 100px 0; max-width: 800px; margin: 0 auto; text-align: center; }

/* --- ADD FORM --- */
.view-add {
  max-width: 600px; margin: 40px auto;
  background: var(--card-bg); padding: 40px;
  border-radius: 16px; border: 1px solid var(--border);
}
.add-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 20px; }
.form-row.three input { flex: 1; }
.add-form input, .add-form textarea {
  width: 100%; padding: 12px; background: var(--bg);
  border: 1px solid var(--border); color: var(--text);
  border-radius: 8px; font-family: inherit; outline: none;
}
.add-form input:focus, .add-form textarea:focus { border-color: var(--primary); }
.add-form textarea { height: 300px; resize: vertical; font-family: var(--font-mono); }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* --- FOOTER --- */
.app-footer {
  border-top: 1px solid var(--border);
  padding: 20px; background: var(--bg); margin-top: auto;
}
.footer-content {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: center;
  gap: 15px; color: var(--text-muted); font-size: 0.85rem;
}
.brand-link {
  display: flex; align-items: center; gap: 6px;
  color: var(--text-muted); text-decoration: none;
  transition: color 0.2s;
}
.brand-link:hover { color: var(--primary); }
.divider { color: var(--border); }
.empty-state { text-align: center; color: var(--text-muted); margin-top: 100px; }
</style>