// --- STATE MANAGEMENT ---
let state = {
  songs: [],
  setlists: [{ id: "default", name: "My First Setlist", songIds: [] }],
  activeSetlistId: "default",
  theme: "dark",
};

let currentSongId = null;
let autoScrollInterval = null;
let isPlayingSetlist = false;
let currentPlayingIndex = 0;

function loadData() {
  const saved = localStorage.getItem("lyricAppState");
  if (saved) {
    let parsed = JSON.parse(saved);
    if (!parsed.setlists) {
      parsed.setlists = [
        {
          id: "default",
          name: "My First Setlist",
          songIds: parsed.setlistIds || [],
        },
      ];
      parsed.activeSetlistId = "default";
    }
    state = parsed;
  }
  applyTheme(state.theme);
  renderLibrary();
  updateSetlistDropdown();
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

function goBack() {
  stopAutoScroll();
  if (isPlayingSetlist) {
    navigate("setlists");
  } else {
    navigate("library");
  }
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

  // Search functionality
  const searchInput = document.getElementById("search-bar");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  const filteredSongs = state.songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(searchTerm) ||
      song.band.toLowerCase().includes(searchTerm) ||
      song.lyrics.toLowerCase().includes(searchTerm)
    );
  });

  if (filteredSongs.length === 0) {
    grid.innerHTML =
      '<p class="empty-state">No songs found. Try adjusting your search or add a new song!</p>';
    return;
  }

  filteredSongs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => {
      isPlayingSetlist = false;
      viewSong(song.id);
    };

    const title = document.createElement("h3");
    title.textContent = song.title;

    const bpmString = song.bpm ? ` • ${song.bpm} BPM` : "";
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${song.band} • Key: ${song.key || "N/A"}${bpmString}`;

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
    document.getElementById("song-time").value = song.time || "";
    document.getElementById("song-bpm").value = song.bpm || "";
    document.getElementById("song-lyrics").value = song.lyrics;
    document.getElementById("modal-title").textContent = "Edit Song";
  } else {
    document.getElementById("song-id").value = "";
    document.getElementById("song-title").value = "";
    document.getElementById("song-band").value = "";
    document.getElementById("song-key").value = "";
    document.getElementById("song-time").value = "";
    document.getElementById("song-bpm").value = "";
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
    bpm: document.getElementById("song-bpm").value,
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
  // Clear search bar when saving to see the newly added/edited song clearly
  const searchInput = document.getElementById("search-bar");
  if (searchInput) searchInput.value = "";

  renderLibrary();
  renderSetlistSource();
  renderActiveSetlist();
  closeModal();

  if (document.getElementById("view-lyric").classList.contains("active")) {
    viewSong(id);
  }
}

function deleteSong() {
  if (!confirm("Are you sure you want to delete this song everywhere?")) return;
  const id = document.getElementById("song-id").value;
  state.songs = state.songs.filter((s) => s.id !== id);
  state.setlists.forEach(
    (setlist) =>
      (setlist.songIds = setlist.songIds.filter((sId) => sId !== id)),
  );

  saveData();
  renderLibrary();
  renderSetlistSource();
  renderActiveSetlist();
  closeModal();
  navigate("library");
}

// --- LYRIC VIEW, NAV & AUTO-SCROLL ---
function viewSong(id) {
  currentSongId = id;
  const song = state.songs.find((s) => s.id === id);
  if (!song) return;

  document.getElementById("detail-title").textContent = song.title;
  const bpmStr = song.bpm ? ` • ${song.bpm} BPM` : "";
  document.getElementById("detail-meta").textContent =
    `${song.band} • Key: ${song.key} • Time: ${song.time}${bpmStr}`;
  document.getElementById("detail-lyrics").textContent = song.lyrics;

  const navContainer = document.getElementById("setlist-nav");
  if (isPlayingSetlist) {
    navContainer.style.display = "flex";
    const activeSL = getActiveSetlist();
    document.getElementById("setlist-progress").textContent =
      `${currentPlayingIndex + 1} / ${activeSL.songIds.length}`;
    document.getElementById("btn-prev").disabled = currentPlayingIndex === 0;
    document.getElementById("btn-next").disabled =
      currentPlayingIndex === activeSL.songIds.length - 1;
  } else {
    navContainer.style.display = "none";
  }

  navigate("lyric");
}

function navigateSetlist(direction) {
  const activeSL = getActiveSetlist();
  const newIndex = currentPlayingIndex + direction;
  if (newIndex >= 0 && newIndex < activeSL.songIds.length) {
    currentPlayingIndex = newIndex;
    stopAutoScroll();
    viewSong(activeSL.songIds[newIndex]);
  }
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
    autoScrollInterval = setInterval(() => window.scrollBy(0, 1), 30);
  }
}

function stopAutoScroll() {
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
  document.getElementById("scroll-btn").textContent = "Play Auto-Scroll";
}

// --- MULTIPLE SETLISTS MANAGER ---
function updateSetlistDropdown() {
  const selector = document.getElementById("setlist-selector");
  selector.innerHTML = "";
  state.setlists.forEach((sl) => {
    const opt = document.createElement("option");
    opt.value = sl.id;
    opt.textContent = sl.name;
    if (sl.id === state.activeSetlistId) opt.selected = true;
    selector.appendChild(opt);
  });
}

function changeActiveSetlist() {
  state.activeSetlistId = document.getElementById("setlist-selector").value;
  saveData();
  renderActiveSetlist();
}

function createNewSetlist() {
  const name = prompt("Enter a name for the new setlist:");
  if (!name) return;
  const newId = "set_" + Date.now();
  state.setlists.push({ id: newId, name: name, songIds: [] });
  state.activeSetlistId = newId;
  saveData();
  updateSetlistDropdown();
  renderActiveSetlist();
}

function deleteActiveSetlist() {
  if (state.setlists.length <= 1)
    return alert("You must have at least one setlist.");
  if (!confirm("Delete this setlist? (Songs will remain in your library)"))
    return;
  state.setlists = state.setlists.filter(
    (sl) => sl.id !== state.activeSetlistId,
  );
  state.activeSetlistId = state.setlists[0].id;
  saveData();
  updateSetlistDropdown();
  renderActiveSetlist();
}

function getActiveSetlist() {
  return state.setlists.find((sl) => sl.id === state.activeSetlistId);
}

function playActiveSetlist() {
  const activeSL = getActiveSetlist();
  if (!activeSL || activeSL.songIds.length === 0)
    return alert("Add some songs to the setlist first!");

  isPlayingSetlist = true;
  currentPlayingIndex = 0;
  viewSong(activeSL.songIds[0]);
}

// --- DRAG, DROP & REARRANGE ---
function renderSetlistSource() {
  const source = document.getElementById("drag-source");
  source.innerHTML = "";
  state.songs.forEach((song) => {
    const li = document.createElement("li");
    li.className = "song-list-item draggable";
    li.draggable = true;
    li.ondragstart = (e) => e.dataTransfer.setData("text/plain", song.id);

    const titleSpan = document.createElement("span");
    titleSpan.textContent = `${song.title} - ${song.band}`;

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.className = "icon-btn primary-btn";
    addBtn.onclick = () => addSongToSetlist(song.id);

    li.appendChild(titleSpan);
    li.appendChild(addBtn);
    source.appendChild(li);
  });
}

function renderActiveSetlist() {
  const target = document.getElementById("drop-target");
  target.innerHTML = "";
  const activeSL = getActiveSetlist();
  if (!activeSL) return;

  activeSL.songIds.forEach((id, index) => {
    const song = state.songs.find((s) => s.id === id);
    if (song) {
      const li = document.createElement("li");
      li.className = "song-list-item";

      const titleSpan = document.createElement("span");
      titleSpan.textContent = `${index + 1}. ${song.title}`;
      titleSpan.style.cursor = "pointer";
      titleSpan.onclick = () => {
        isPlayingSetlist = true;
        currentPlayingIndex = index;
        viewSong(song.id);
      };

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const upBtn = document.createElement("button");
      upBtn.innerHTML = "▲";
      upBtn.className = "icon-btn";
      upBtn.onclick = () => moveInSetlist(index, -1);

      const downBtn = document.createElement("button");
      downBtn.innerHTML = "▼";
      downBtn.className = "icon-btn";
      downBtn.onclick = () => moveInSetlist(index, 1);

      const remBtn = document.createElement("button");
      remBtn.innerHTML = "✖";
      remBtn.className = "icon-btn danger-btn";
      remBtn.onclick = () => removeFromSetlist(index);

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(remBtn);
      li.appendChild(titleSpan);
      li.appendChild(actions);
      target.appendChild(li);
    }
  });
}

function addSongToSetlist(songId) {
  getActiveSetlist().songIds.push(songId);
  saveData();
  renderActiveSetlist();
}

function moveInSetlist(index, direction) {
  const activeSL = getActiveSetlist();
  if (index + direction < 0 || index + direction >= activeSL.songIds.length)
    return;
  const temp = activeSL.songIds[index];
  activeSL.songIds[index] = activeSL.songIds[index + direction];
  activeSL.songIds[index + direction] = temp;
  saveData();
  renderActiveSetlist();
}

function removeFromSetlist(index) {
  getActiveSetlist().songIds.splice(index, 1);
  saveData();
  renderActiveSetlist();
}

const dropzone = document.getElementById("drop-target");
dropzone.ondragover = (e) => {
  e.preventDefault();
  dropzone.classList.add("drag-over");
};
dropzone.ondragleave = () => dropzone.classList.remove("drag-over");
dropzone.ondrop = (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  const songId = e.dataTransfer.getData("text/plain");
  if (songId) addSongToSetlist(songId);
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
