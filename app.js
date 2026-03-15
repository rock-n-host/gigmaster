// --- STATE MANAGEMENT ---
let state = {
  songs: [],
  setlistIds: [],
  theme: "dark",
};

let currentSongId = null;
let autoScrollInterval = null;

// Load from LocalStorage
function loadData() {
  const saved = localStorage.getItem("lyricAppState");
  if (saved) {
    state = JSON.parse(saved);
  }
  applyTheme(state.theme);
  renderLibrary();
  renderSetlistSource();
  renderActiveSetlist();
}

function saveData() {
  localStorage.setItem("lyricAppState", JSON.stringify(state));
}

// --- NAVIGATION & UI ---
function navigate(viewId) {
  document
    .querySelectorAll(".view")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${viewId}`).classList.add("active");
  window.scrollTo(0, 0);
  stopAutoScroll();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  saveData();
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  document.getElementById("theme-toggle").textContent =
    theme === "dark" ? "☀️ Light" : "🌙 Dark";
}

// --- LIBRARY & CRUD ---
function renderLibrary() {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";

  state.songs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => viewSong(song.id);

    const title = document.createElement("h3");
    title.textContent = song.title;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${song.band} • Key: ${song.key || "N/A"}`;

    card.appendChild(title);
    card.appendChild(meta);
    grid.appendChild(card);
  });
}

function openModal(songId = null) {
  document.getElementById("song-modal").classList.remove("hidden");
  document.getElementById("delete-btn").style.display = songId
    ? "block"
    : "none";

  if (songId) {
    const song = state.songs.find((s) => s.id === songId);
    document.getElementById("song-id").value = song.id;
    document.getElementById("song-title").value = song.title;
    document.getElementById("song-band").value = song.band;
    document.getElementById("song-key").value = song.key;
    document.getElementById("song-time").value = song.time;
    document.getElementById("song-lyrics").value = song.lyrics;
    document.getElementById("modal-title").textContent = "Edit Song";
  } else {
    document.getElementById("song-id").value = "";
    document.getElementById("song-title").value = "";
    document.getElementById("song-band").value = "";
    document.getElementById("song-key").value = "";
    document.getElementById("song-time").value = "";
    document.getElementById("song-lyrics").value = "";
    document.getElementById("modal-title").textContent = "Add New Song";
  }
}

function closeModal() {
  document.getElementById("song-modal").classList.add("hidden");
}

function saveSong() {
  const id = document.getElementById("song-id").value || Date.now().toString();
  const newSong = {
    id: id,
    title: document.getElementById("song-title").value,
    band: document.getElementById("song-band").value,
    key: document.getElementById("song-key").value,
    time: document.getElementById("song-time").value,
    lyrics: document.getElementById("song-lyrics").value,
  };

  if (!newSong.title) return alert("Title is required!");

  const existingIndex = state.songs.findIndex((s) => s.id === id);
  if (existingIndex > -1) {
    state.songs[existingIndex] = newSong;
  } else {
    state.songs.push(newSong);
  }

  saveData();
  renderLibrary();
  renderSetlistSource();
  closeModal();

  if (document.getElementById("view-lyric").classList.contains("active")) {
    viewSong(id); // refresh if editing while viewing
  }
}

function deleteSong() {
  if (!confirm("Are you sure you want to delete this song?")) return;
  const id = document.getElementById("song-id").value;
  state.songs = state.songs.filter((s) => s.id !== id);
  state.setlistIds = state.setlistIds.filter((sId) => sId !== id);
  saveData();
  renderLibrary();
  renderSetlistSource();
  renderActiveSetlist();
  closeModal();
  navigate("library");
}

// --- LYRIC VIEW & AUTO-SCROLL ---
function viewSong(id) {
  currentSongId = id;
  const song = state.songs.find((s) => s.id === id);
  if (!song) return;

  // Using textContent prevents XSS injection
  document.getElementById("detail-title").textContent = song.title;
  document.getElementById("detail-meta").textContent =
    `${song.band} • Key: ${song.key} • Time: ${song.time}`;
  document.getElementById("detail-lyrics").textContent = song.lyrics;

  navigate("lyric");
}

function editCurrentSong() {
  if (currentSongId) openModal(currentSongId);
}

function toggleAutoScroll() {
  const btn = document.getElementById("scroll-btn");
  if (autoScrollInterval) {
    stopAutoScroll();
  } else {
    btn.textContent = "Pause Auto-Scroll";
    autoScrollInterval = setInterval(() => {
      window.scrollBy(0, 1); // Scrolls 1px down
    }, 30); // Adjust this number for speed (lower is faster)
  }
}

function stopAutoScroll() {
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
  document.getElementById("scroll-btn").textContent = "Play Auto-Scroll";
}

// --- SETLIST BUILDER (DRAG & DROP) ---
function renderSetlistSource() {
  const source = document.getElementById("drag-source");
  source.innerHTML = "";
  state.songs.forEach((song) => {
    const li = document.createElement("li");
    li.textContent = `${song.title} - ${song.band}`;
    li.draggable = true;
    li.ondragstart = (e) => e.dataTransfer.setData("text/plain", song.id);
    source.appendChild(li);
  });
}

function renderActiveSetlist() {
  const target = document.getElementById("drop-target");
  target.innerHTML = "";
  state.setlistIds.forEach((id, index) => {
    const song = state.songs.find((s) => s.id === id);
    if (song) {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${song.title}`;
      li.onclick = () => viewSong(song.id);
      target.appendChild(li);
    }
  });
}

function clearSetlist() {
  state.setlistIds = [];
  saveData();
  renderActiveSetlist();
}

// Drag Events for Dropzone
const dropzone = document.getElementById("drop-target");
dropzone.ondragover = (e) => {
  e.preventDefault(); // necessary to allow dropping
  dropzone.classList.add("drag-over");
};
dropzone.ondragleave = () => dropzone.classList.remove("drag-over");
dropzone.ondrop = (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  const songId = e.dataTransfer.getData("text/plain");
  if (songId) {
    state.setlistIds.push(songId);
    saveData();
    renderActiveSetlist();
  }
};

// --- IMPORT / EXPORT (JSON) ---
function exportData() {
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "lyric-manager-backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedState = JSON.parse(e.target.result);
      if (importedState.songs) {
        state = importedState;
        saveData();
        loadData();
        alert("Data imported successfully!");
      }
    } catch (err) {
      alert("Error importing file. Make sure it's a valid backup JSON.");
    }
  };
  reader.readAsText(file);
}

// Initialize App
loadData();
