<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { 
  Music, ListMusic, Sun, Moon, Search, Plus, Trash2, Pencil,
  Play, Pause, ChevronLeft, Github, Save, X, ArrowUp, ArrowDown, ChevronRight
} from 'lucide-vue-next';

// --- STATE ---
const view = ref('library'); 
const isDark = ref(true);
const songs = ref([]);
const setlists = ref([]);
const searchQuery = ref('');
const lyricsContent = ref('');

// Active Item State
const selectedSong = ref(null);
const activeSetlist = ref(null);
const currentSetlistIndex = ref(-1);

// Forms
const songForm = ref({ id: null, title: '', artist: '', key: '', bpm: '', timeSignature: '', genre: '', lyrics: '' });
const newSetlistName = ref('');
const isAddSongModalOpen = ref(false);

// Auto Scroll
const isScrolling = ref(false);
const scrollSpeed = ref(1);
let scrollInterval = null;

// --- API ACTIONS ---

const fetchLibrary = async () => {
  try {
    const [sRes, lRes] = await Promise.all([
        axios.get('/api/songs'),
        axios.get('/api/setlists')
    ]);
    songs.value = sRes.data;
    setlists.value = lRes.data;
  } catch (e) { console.error(e); }
};

const initSongForm = (song = null) => {
    if (song) {
        // Edit Mode: fetch lyrics first
        axios.get(`/api/lyrics?file=${song.id}`).then(res => {
            songForm.value = { 
                id: song.id, // ID present = Update mode
                title: song.title, 
                artist: song.artist, 
                key: song.key !== '-' ? song.key : '', 
                bpm: song.bpm || '', 
                timeSignature: song.timeSignature !== '-' ? song.timeSignature : '',
                genre: song.genre, 
                lyrics: res.data 
            };
            view.value = 'add';
        });
    } else {
        // Create Mode
        songForm.value = { id: null, title: '', artist: '', key: '', bpm: '', timeSignature: '', genre: '', lyrics: '' };
        view.value = 'add';
    }
};

const saveSong = async () => {
  try {
    if (songForm.value.id) {
        // Update
        await axios.put(`/api/songs/${songForm.value.id}`, songForm.value);
        alert('Song Updated!');
    } else {
        // Create
        await axios.post('/api/songs', songForm.value);
        alert('Song Created!');
    }
    fetchLibrary();
    view.value = 'library';
  } catch (e) { alert('Error saving song'); }
};

const deleteSong = async (id, event) => {
    event.stopPropagation();
    if(!confirm('Permanently delete this song?')) return;
    try {
        await axios.delete(`/api/songs/${id}`);
        fetchLibrary();
    } catch (e) { alert('Error deleting song'); }
};

// --- SETLIST ACTIONS ---

const createSetlist = async () => {
    if (!newSetlistName.value) return;
    try {
        await axios.post('/api/setlists', { name: newSetlistName.value });
        newSetlistName.value = '';
        fetchLibrary();
    } catch (e) { alert('Error creating setlist'); }
};

const deleteSetlist = async (id) => {
    if(!confirm('Delete this setlist?')) return;
    await axios.delete(`/api/setlists/${id}`);
    fetchLibrary();
    if (activeSetlist.value?.id === id) view.value = 'setlists';
};

const openSetlist = (list) => { activeSetlist.value = list; view.value = 'setlist-detail'; };

const addSongToSetlist = async (songId) => {
    if (!activeSetlist.value) return;
    const updatedSongs = [...activeSetlist.value.songs, songId];
    await updateSetlistSongs(activeSetlist.value.id, updatedSongs);
    isAddSongModalOpen.value = false;
};

const removeSongFromSetlist = async (index) => {
    const updatedSongs = [...activeSetlist.value.songs];
    updatedSongs.splice(index, 1);
    await updateSetlistSongs(activeSetlist.value.id, updatedSongs);
};

const moveSong = async (index, direction) => {
    const newIndex = index + direction;
    const list = [...activeSetlist.value.songs];
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]]; 
    await updateSetlistSongs(activeSetlist.value.id, list);
};

const updateSetlistSongs = async (id, songs) => {
    await axios.put(`/api/setlists/${id}`, { songs });
    activeSetlist.value.songs = songs;
    fetchLibrary(); 
};

// --- NAVIGATION ACTIONS ---

const openSong = async (song, fromSetlist = false, index = -1) => {
  selectedSong.value = song;
  currentSetlistIndex.value = index; 
  view.value = 'song';
  try {
    const res = await axios.get(`/api/lyrics?file=${song.id}`);
    lyricsContent.value = res.data;
  } catch (e) { lyricsContent.value = "Error loading lyrics."; }
};

const nextSong = () => {
    if (currentSetlistIndex.value === -1 || !activeSetlist.value) return;
    const nextIdx = currentSetlistIndex.value + 1;
    if (nextIdx < activeSetlist.value.songs.length) {
        const nextId = activeSetlist.value.songs[nextIdx];
        const nextSongObj = songs.value.find(s => s.id === nextId);
        if (nextSongObj) openSong(nextSongObj, true, nextIdx);
    }
};

const prevSong = () => {
    if (currentSetlistIndex.value <= 0 || !activeSetlist.value) return;
    const prevIdx = currentSetlistIndex.value - 1;
    const prevId = activeSetlist.value.songs[prevIdx];
    const prevSongObj = songs.value.find(s => s.id === prevId);
    if (prevSongObj) openSong(prevSongObj, true, prevIdx);
};

// --- UI HELPERS ---
const toggleTheme = () => { isDark.value = !isDark.value; document.body.classList.toggle('light-theme', !isDark.value); };
const toggleScroll = () => { isScrolling.value ? stopScroll() : startScroll(); };
const startScroll = () => { isScrolling.value = true; scrollInterval = setInterval(() => { window.scrollBy(0, scrollSpeed.value); }, 50); };
const stopScroll = () => { isScrolling.value = false; clearInterval(scrollInterval); };

const filteredSongs = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return songs.value.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
});

const getSongById = (id) => songs.value.find(s => s.id === id) || { title: id, artist: 'Unknown', key: '-' };

onMounted(() => {
  fetchLibrary();
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`://`);
  ws.onmessage = (e) => { if (JSON.parse(e.data).type === 'REFRESH') fetchLibrary(); };
});
</script>

<template>
  <div class="app-shell" :class="{ 'dark': isDark, 'light': !isDark }">
    <nav class="navbar">
      <div class="nav-brand" @click="view = 'library'">
        <img src="/logo.svg" alt="Gigmaster" class="brand-logo" />
        <span>Gigmaster</span>
      </div>
      <div class="nav-links">
        <a :class="{ active: view === 'library' }" @click="view = 'library'"><Music size="18"/> Library</a>
        <a :class="{ active: view.includes('setlist') }" @click="view = 'setlists'"><ListMusic size="18"/> Setlists</a>
      </div>
      <div class="nav-actions">
        <button class="icon-btn" @click="toggleTheme"><Sun v-if="isDark" size="20" /><Moon v-else size="20" /></button>
      </div>
    </nav>

    <main class="container">
      
      <!-- VIEW: LIBRARY -->
      <div v-if="view === 'library'" class="view-library">
        <div class="toolbar">
          <div class="search-wrap"><Search class="search-icon" size="20"/><input v-model="searchQuery" type="text" placeholder="Search songs..." /></div>
          <div class="toolbar-actions"><button class="btn btn-primary" @click="initSongForm()"><Plus size="18" /> Add Song</button></div>
        </div>
        <div class="song-grid">
          <div v-for="song in filteredSongs" :key="song.id" class="song-card" @click="openSong(song)">
            <div class="card-header">
                <span class="song-title">{{ song.title }}</span>
                <span class="badge key-badge" v-if="song.key !== '-'">{{ song.key }}</span>
            </div>
            <div class="song-artist">{{ song.artist }}</div>
            <div class="card-footer">
              <div class="meta-dot" v-if="song.bpm > 0"><div class="dot"></div> {{ song.bpm }} BPM</div>
              <div class="meta-dot" v-if="song.timeSignature && song.timeSignature !== '-'"> • {{ song.timeSignature }}</div>
            </div>
            
            <div class="card-actions">
                <button class="icon-btn" @click.stop="initSongForm(song)"><Pencil size="16" /></button>
                <button class="icon-btn danger" @click.stop="deleteSong(song.id, )"><Trash2 size="16" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW: SETLISTS LIST -->
      <div v-if="view === 'setlists'" class="view-setlists">
         <div class="toolbar">
             <h2>Your Setlists</h2>
             <div class="create-setlist">
                 <input v-model="newSetlistName" placeholder="New Setlist Name..." @keyup.enter="createSetlist"/>
                 <button class="btn btn-primary" @click="createSetlist">Create</button>
             </div>
         </div>
         <div class="setlist-grid">
             <div v-for="list in setlists" :key="list.id" class="song-card setlist-card" @click="openSetlist(list)">
                 <div class="card-header"><span class="song-title">{{ list.name }}</span></div>
                 <div class="song-artist">{{ list.songs.length }} Songs</div>
                 <div class="card-actions">
                    <button class="icon-btn danger" @click.stop="deleteSetlist(list.id)"><Trash2 size="16"/></button>
                 </div>
             </div>
         </div>
      </div>

      <!-- VIEW: SETLIST DETAIL -->
      <div v-if="view === 'setlist-detail'" class="view-setlist-detail">
          <div class="toolbar">
              <button class="btn btn-ghost" @click="view = 'setlists'"><ChevronLeft /> All Setlists</button>
              <h2>{{ activeSetlist.name }}</h2>
              <button class="btn btn-primary" @click="isAddSongModalOpen = true"><Plus size="18"/> Add Song</button>
          </div>
          
          <div class="setlist-songs">
              <div v-if="activeSetlist.songs.length === 0" class="empty-state">No songs yet. Add one!</div>
              <div v-for="(songId, idx) in activeSetlist.songs" :key="idx" class="setlist-row">
                  <div class="row-info" @click="openSong(getSongById(songId), true, idx)">
                      <span class="row-idx">{{ idx + 1 }}.</span>
                      <span class="row-title">{{ getSongById(songId).title }}</span>
                      <span class="row-artist">{{ getSongById(songId).artist }}</span>
                  </div>
                  <div class="row-actions">
                      <button class="icon-btn" @click="moveSong(idx, -1)" v-if="idx > 0"><ArrowUp size="16"/></button>
                      <button class="icon-btn" @click="moveSong(idx, 1)" v-if="idx < activeSetlist.songs.length - 1"><ArrowDown size="16"/></button>
                      <button class="icon-btn danger" @click="removeSongFromSetlist(idx)"><X size="16"/></button>
                  </div>
              </div>
          </div>
      </div>

      <!-- VIEW: SONG DETAIL -->
      <div v-if="view === 'song'" class="view-song">
        <div class="song-control-bar">
          <button class="btn btn-ghost" @click="currentSetlistIndex > -1 ? view = 'setlist-detail' : view = 'library'"><ChevronLeft /> Back</button>
          
          <div class="gig-nav" v-if="currentSetlistIndex > -1">
              <button class="icon-btn" @click="prevSong" :disabled="currentSetlistIndex === 0"><ChevronLeft/></button>
              <div class="song-info-center">
                <h2>{{ selectedSong.title }}</h2>
                <span class="sub">
                    {{ selectedSong.artist }} • {{ selectedSong.key }} 
                    <span v-if="selectedSong.timeSignature && selectedSong.timeSignature !== '-'"> • {{ selectedSong.timeSignature }}</span>
                </span>
              </div>
              <button class="icon-btn" @click="nextSong" :disabled="currentSetlistIndex >= activeSetlist.songs.length - 1"><ChevronRight/></button>
          </div>
          <div class="song-info-center" v-else>
            <h2>{{ selectedSong.title }}</h2>
            <span class="sub">
                {{ selectedSong.artist }} • {{ selectedSong.key }}
                <span v-if="selectedSong.timeSignature && selectedSong.timeSignature !== '-'"> • {{ selectedSong.timeSignature }}</span>
            </span>
          </div>

          <div class="scroll-controls">
            <input type="range" min="1" max="5" step="0.5" v-model="scrollSpeed">
            <button class="btn btn-primary circle" @click="toggleScroll">
              <Pause v-if="isScrolling" fill="currentColor" /><Play v-else fill="currentColor" />
            </button>
            <button class="icon-btn" @click="initSongForm(selectedSong)" title="Edit"><Pencil size="18"/></button>
          </div>
        </div>
        <div class="lyrics-paper"><pre>{{ lyricsContent }}</pre></div>
      </div>

      <!-- VIEW: ADD/EDIT SONG -->
      <div v-if="view === 'add'" class="view-add">
        <h2>{{ songForm.id ? 'Edit Song' : 'Add New Song' }}</h2>
        <form @submit.prevent="saveSong" class="add-form">
          <div class="form-row"><input v-model="songForm.title" placeholder="Song Title" required /><input v-model="songForm.artist" placeholder="Artist" /></div>
          <div class="form-row four">
              <input v-model="songForm.key" placeholder="Key" />
              <input v-model="songForm.bpm" placeholder="BPM" type="number" />
              <input v-model="songForm.timeSignature" placeholder="Time Sig (4/4)" />
              <input v-model="songForm.genre" placeholder="Genre" />
          </div>
          <textarea v-model="songForm.lyrics" placeholder="Lyrics..." required></textarea>
          <div class="form-actions"><button type="button" class="btn" @click="view='library'">Cancel</button><button type="submit" class="btn btn-primary">Save Song</button></div>
        </form>
      </div>

      <!-- MODAL: ADD TO SETLIST -->
      <div v-if="isAddSongModalOpen" class="modal-overlay" @click.self="isAddSongModalOpen = false">
          <div class="modal">
              <h3>Add Song to Setlist</h3>
              <input v-model="searchQuery" placeholder="Search library..." class="modal-search"/>
              <div class="modal-list">
                  <div v-for="song in filteredSongs" :key="song.id" class="modal-item" @click="addSongToSetlist(song.id)">
                      {{ song.title }} <span class="sub">{{ song.artist }}</span>
                  </div>
              </div>
              <button class="btn" @click="isAddSongModalOpen = false">Close</button>
          </div>
      </div>
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <span class="version">Version 2025.11.23</span><span class="divider">•</span>
        <a href="[https://github.com/rock-n-host](https://github.com/rock-n-host)" target="_blank" class="brand-link"><Github size="14" /> rock-n-host</a>
      </div>
    </footer>
  </div>
</template>

<style>
/* --- VARIABLES & BASE --- */
:root { --bg: #0f172a; --card-bg: #1e293b; --text: #f8fafc; --text-muted: #94a3b8; --primary: #6366f1; --primary-hover: #4f46e5; --border: #334155; --font-main: 'Inter', sans-serif; --font-mono: 'Courier New', monospace; }
.light-theme { --bg: #f1f5f9; --card-bg: #ffffff; --text: #0f172a; --text-muted: #64748b; --primary: #4f46e5; --border: #e2e8f0; }
* { box-sizing: border-box; } body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-main); transition: background 0.3s; }
pre { font-family: var(--font-mono); font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap; }

/* --- LAYOUT --- */
.app-shell { min-height: 100vh; display: flex; flex-direction: column; } .container { max-width: 1200px; margin: 0 auto; width: 100%; padding: 20px; flex: 1; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 30px; height: 70px; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 50; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.2rem; cursor: pointer; } .brand-logo { width: 36px; height: 36px; transition: transform 0.2s; } .nav-brand:hover .brand-logo { transform: rotate(-5deg); }
.nav-links { display: flex; gap: 30px; } .nav-links a { display: flex; align-items: center; gap: 8px; color: var(--text-muted); cursor: pointer; font-weight: 500; transition: 0.2s; } .nav-links a:hover, .nav-links a.active { color: var(--primary); } 
.icon-btn { background: none; border: none; color: var(--text); cursor: pointer; padding: 5px; } .icon-btn:hover { color: var(--primary); } .icon-btn.danger:hover { color: #ef4444; }

/* --- COMPONENTS --- */
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; margin-top: 10px; } 
.search-wrap { position: relative; width: 400px; } .search-icon { position: absolute; left: 12px; top: 12px; color: var(--text-muted); } .search-wrap input { width: 100%; padding: 12px 12px 12px 40px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); font-size: 1rem; outline: none; }
.btn { padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: 0.2s; } .btn-primary { background: var(--primary); color: white; } .btn-primary:hover { background: var(--primary-hover); } .btn-ghost { background: transparent; color: var(--text-muted); } .btn-ghost:hover { color: var(--text); } .btn.circle { padding: 0; width: 40px; height: 40px; justify-content: center; border-radius: 50%; }

/* --- CARDS & GRID --- */
.song-grid, .setlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; } 
.song-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; } 
.song-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: var(--primary); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; } .song-title { font-weight: 700; font-size: 1.1rem; } .song-artist { color: var(--primary); margin-bottom: 15px; font-weight: 500; } .badge { background: #334155; color: #f8fafc; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
.card-actions { position: absolute; bottom: 15px; right: 15px; opacity: 0; transition: 0.2s; display: flex; gap: 5px; } .song-card:hover .card-actions { opacity: 1; }

/* --- SETLIST DETAILS --- */
.create-setlist { display: flex; gap: 10px; } .create-setlist input { padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); }
.setlist-songs { display: flex; flex-direction: column; gap: 10px; max-width: 800px; margin: 0 auto; }
.setlist-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border); }
.row-info { display: flex; align-items: center; gap: 15px; cursor: pointer; flex: 1; } .row-idx { font-family: var(--font-mono); color: var(--text-muted); width: 30px; } .row-title { font-weight: bold; } .row-artist { color: var(--text-muted); font-size: 0.9rem; }
.row-actions { display: flex; gap: 5px; }

/* --- SONG & GIG VIEW --- */
.song-control-bar { display: flex; justify-content: space-between; align-items: center; position: sticky; top: 70px; background: var(--bg); padding: 15px 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; z-index: 40; } 
.gig-nav { display: flex; align-items: center; gap: 20px; flex: 1; justify-content: center; }
.song-info-center { text-align: center; } .song-info-center h2 { margin: 0; font-size: 1.5rem; } .song-info-center .sub { color: var(--primary); font-weight: 600; } 
.scroll-controls { display: flex; align-items: center; gap: 15px; } .lyrics-paper { padding: 0 0 100px 0; max-width: 800px; margin: 0 auto; text-align: center; }

/* --- FORMS & MODALS --- */
.view-add { max-width: 600px; margin: 40px auto; background: var(--card-bg); padding: 40px; border-radius: 16px; border: 1px solid var(--border); } .add-form { display: flex; flex-direction: column; gap: 20px; } .form-row { display: flex; gap: 20px; } .form-row.four input { flex: 1; } .add-form input, .add-form textarea { width: 100%; padding: 12px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; font-family: inherit; outline: none; } .add-form input:focus, .add-form textarea:focus { border-color: var(--primary); } .add-form textarea { height: 300px; resize: vertical; font-family: var(--font-mono); } .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal { background: var(--card-bg); padding: 30px; border-radius: 12px; width: 500px; max-height: 80vh; display: flex; flex-direction: column; gap: 15px; border: 1px solid var(--border); }
.modal-search { width: 100%; padding: 10px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px; }
.modal-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 5px; }
.modal-item { padding: 10px; cursor: pointer; border-radius: 4px; } .modal-item:hover { background: var(--primary); color: white; } .modal-item .sub { opacity: 0.7; font-size: 0.9em; margin-left: 10px; }

.app-footer { border-top: 1px solid var(--border); padding: 20px; background: var(--bg); margin-top: auto; } .footer-content { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 15px; color: var(--text-muted); font-size: 0.85rem; } .brand-link { display: flex; align-items: center; gap: 6px; color: var(--text-muted); text-decoration: none; transition: color 0.2s; } .brand-link:hover { color: var(--primary); } .divider { color: var(--border); } .empty-state { text-align: center; color: var(--text-muted); margin-top: 100px; }
</style>
