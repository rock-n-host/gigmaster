<template>
  <div class="add-song">
    <h3>Add new lyrics</h3>
    <form @submit.prevent="submit">
      <input v-model="title" placeholder="Title" required />
      <input v-model="band" placeholder="Band" />
      <input v-model="genre" placeholder="Genre" />
      <input v-model="release_date" placeholder="Release date" />
      <textarea v-model="lyrics" placeholder="Paste full lyrics here..." rows="8" required></textarea>
      <button type="submit">Add</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return { title: '', band: '', genre: '', release_date: '', lyrics: '' };
  },
  methods: {
    async submit() {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      await axios.post(`${base}/api/song`, {
        title: this.title,
        band: this.band,
        genre: this.genre,
        release_date: this.release_date,
        lyrics: this.lyrics
      });
      this.title = this.band = this.genre = this.release_date = this.lyrics = '';
      this.$emit('added');
    }
  }
};
</script>

<style scoped>
.add-song form input, .add-song form textarea { width:100%; margin-bottom:8px; padding:8px; }
</style>
