<template>
  <div class="song-list">
    <h2>Songs</h2>
    <ul>
      <li v-for="s in songs" :key="s.filename" @click="$emit('select', s)">
        <div class="song-title">{{ s.title || s.filename }}</div>
        <div class="song-band">{{ s.band }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['songs']
};
</script>

<style scoped>
.song-list ul { list-style: none; padding: 0; margin: 0; }
.song-list li { padding: 8px; border-bottom: 1px solid rgba(0,0,0,0.08); cursor: pointer; display:flex; justify-content:space-between; }
.song-title { font-weight:600; }
.song-band { opacity:0.7; font-size:0.9em; }
</style>
