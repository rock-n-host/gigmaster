<div align="center">
  <img src="logo.svg" alt="Gigmaster Logo" width="120" />
  <h1>Gigmaster</h1>
  <p><strong>A simple, self-hosted lyrics library without dependenvies.</strong></p>

  ![Version](https://img.shields.io/badge/version-2026.05.02-blue?style=flat-square)
</div>

---

## Overview

**Gigmaster** is a lightweight, responsive web application designed to manage and display lyrics during gigs or rehearsals. It is built to be self-hosted and uses a simple flat-file structure. My goal was to make it as simple as possible so no external frameworks are used, only pure HTML, CSS and javascript.

### Features
* **Light and Dark Mode UI:** Optimized for low-light stage environments.
* **Card Grid Layout:** Easy touch navigation for song selection.
* **Flat-File structure:** Lyrics are stored inside `localStorage` in the Browser and can be imported / exported as JSON. The application itself is just one html file containing everything.

<img src="screenshots/main-page-dark.PNG" alt="main-page-dark" width="600"/>
<img src="screenshots/main-page-light.PNG" alt="main-page-light" width="600"/>


---

## Usage

Right-click the index.html file and open with a Browser. Everything loads instantly.

If you want to host it with Nginx, Apache or something else.
1.  run:
    ```bash
    docker-compose up -d
    ```
2. go to ``` http://localhost:8080 ```.
---

## Adding Songs

You can drag and  songs via the **"Add Song"** button in the **Library** tab, or by importing from the JSON.

<img src="screenshots/add-song-ui.PNG" alt="main-page-light" width="200"/>

## Adding Setlists

There is a default Setlist that can be edited. New ones can be added and also removed. The "Play Setlist" feature displays Songs in order and allows switching to the previous/next one.

<img src="screenshots/setlist-ui.PNG" alt="main-page-light" width="600"/>

---

## TODO

- toggle audio click on/off, keep visual

## Nice to have

- default settings
- save settings to json

---

<div align="center">
  Built by <a href="https://github.com/rock-n-host">rock-n-host</a> with some help from Gemini.
</div>
