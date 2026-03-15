<div align="center">
  <img src="logo.svg" alt="Gigmaster Logo" width="120" />
  <h1>Gigmaster</h1>
  <p><strong>A simple, self-hosted lyrics library without dependenvies.</strong></p>

  ![Version](https://img.shields.io/badge/version-2026.03.15-blue?style=flat-square)
</div>

---

## 🎸 Overview

**Gigmaster** is a lightweight, responsive web application designed to manage and display lyrics during gigs or rehearsals. It is built to be self-hosted and uses a simple flat-file structure. My goal was to make it as simple as possible so no external frameworks are used, only pure HTML, CSS and javascript.

### ✨ Features
* **Dark Mode UI:** Optimized for low-light stage environments.
* **Card Grid Layout:** Easy touch navigation for song selection.
* **Flat-File structure:** Lyrics are stored inside `localStorage` in the Browser and can be imported / exported as JSON. The application itself is just some HTML, CSS and javascript files.


---

## 🚀 Usage

### Option 1: Like every normal human
Right-click the index.html file and open with a Browser. The index.html loads everything else instantly after being opened.

### Option 2: Docker Compose
If you want to serve it with Nginx, Apache or something else.
1.  run:
    ```bash
    docker-compose up -d
    ```
2. go to ``` http://localhost:8080 ```.
---

## 🎵 Adding Songs

You can drag and  songs via the **"Add Song"** button in the **Library** tab, or by importing from the JSON.

## 🗒 Adding Setlists

The Setlist Builder supports Drag and Drop from the Library.

---

<div align="center">
  <sub>Built by <a href="https://github.com/rock-n-host">rock-n-host</a></sub> with a little bit of help from Gemini.
</div>
