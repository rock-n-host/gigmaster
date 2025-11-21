<template>
  <div class="container">
    <header class="header">
      <h1>Gigmaster</h1>
      <div class="controls">
        <input v-model="q" placeholder="Search band or song..." @input="fetchSongs" />
        <select v-model="bandFilter" @change="fetchSongs">
          <option value="">All bands</option>
          <option v-for="b in bands" :key="b" :value="b">{{ b }}</option>
        </select>
        <button @click="toggleTheme">Toggle Theme</button>
      </div>
    </header>

    <main class="main">
      <section class="left">
        <song-list :songs="songs" @select="selectSong" />
        <add-song @added="fetchSongs" />
      </section>

      <aside class="right" v-if="selected">
        <song-view :file="selected" />
      </aside>
    </main>

    <footer class="footer">
      <small>Self-hosted lyrics library — Gigmaster</small>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import SongList from './components/SongList.vue';
import SongView from './components/SongView.vue';
import AddSong from './components/AddSong.vue';
export default {
  components: { SongList, SongView, AddSong },
  data() {
    return {
      songs: [],
      selected: null,
      q: '',
      bandFilter: '',
      bands: []
    };
  },
  methods: {
    async fetchSongs() {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await axios.get(`${base}/api/songs`, {
        params: { q: this.q, band: this.bandFilter }
      });
      this.songs = res.data;
      this.bands = [...new Set(this.songs.map(s => s.band).filter(Boolean))];
    },
    selectSong(item) {
      this.selected = item.filename;
    },
    toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }
  },
  mounted() {
    this.fetchSongs();
  }
};
</script>

<style>
.container { max-width: 1100px; margin: 0 auto; padding: 16px; }
.footer { text-align:center; padding:12px 0; margin-top:18px; color:var(--muted); }
</style>
