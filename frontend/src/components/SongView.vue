<template>
  <div class="song-view">
    <h2>{{ meta.title || filename }}</h2>
    <div class="meta">
      <div><strong>Band:</strong> {{ meta.band }}</div>
      <div v-if="meta.genre"><strong>Genre:</strong> {{ meta.genre }}</div>
      <div v-if="meta.release_date"><strong>Release:</strong> {{ meta.release_date }}</div>
      <div v-if="meta.tempo"><strong>Tempo:</strong> {{ meta.tempo }}</div>
      <div v-if="meta.key"><strong>Key:</strong> {{ meta.key }}</div>
    </div>
    <pre class="lyrics">{{ lyrics }}</pre>

    <h3>Edit metadata</h3>
    <form @submit.prevent="saveMeta">
      <input v-model="meta.title" placeholder="Title" />
      <input v-model="meta.band" placeholder="Band" />
      <input v-model="meta.genre" placeholder="Genre" />
      <input v-model="meta.release_date" placeholder="Release date" />
      <input v-model="meta.tempo" placeholder="Tempo" />
      <input v-model="meta.key" placeholder="Key" />
      <button type="submit">Save</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  props: ['file'],
  data() {
    return { filename: this.file, lyrics: '', meta: {} };
  },
  watch: {
    file: { immediate: true, handler(f) { this.load(f); } }
  },
  methods: {
    async load(f) {
      if (!f) return;
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await axios.get(`${base}/api/song/${encodeURIComponent(f)}`);
      this.filename = res.data.filename;
      this.lyrics = res.data.lyrics;
      this.meta = res.data.metadata || {};
    },
    async saveMeta() {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      await axios.put(`${base}/api/metadata/${encodeURIComponent(this.filename)}`, this.meta);
      alert('Saved');
    }
  }
};
</script>

<style scoped>
.lyrics { white-space: pre-wrap; background: rgba(0,0,0,0.03); padding:10px; border-radius:6px; }
.meta { font-size: 0.95em; margin-bottom: 8px; }
form input { display:block; margin-bottom:6px; width:100%; padding:8px; }
</style>
