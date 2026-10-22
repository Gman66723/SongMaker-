# Song Maker+

A lightweight, client-side music sequencer inspired by the colorful grid concept of Chrome Music Lab Song Maker. **This is an original implementation, not a fork of the official Song Maker app** (its source isn't in the public Chrome Music Lab repository). No Google source code is included.

## Features
- Multiple instrument, drum, and user-uploaded audio tracks
- Tap/click or drag to paint notes in the 16th-note sequencer
- Piano, synth, bass, bell, pluck and drum synthesis with the Web Audio API
- WAV, MP3, OGG, or other browser-supported audio samples imported locally
- Tempo, length, track volume, mute/solo, master volume, song looping
- Offline WAV export (44.1 kHz, 16-bit stereo)
- Save/load full project as JSON, including uploaded sample data
- Responsive layout for desktop, tablet, and mobile

## Run
Open `index.html` in Chrome, Edge, or Safari, or serve the folder over HTTP using `python3 -m http.server 8080`. Click **Play** to initialize audio. Nothing is uploaded to a server.

## Host on GitHub Pages
Create a repository named `SongMaker-`, upload `index.html`, `styles.css`, and `app.js` into its root, then open **Settings → Pages → Deploy from a branch → main / (root)**.

## Notes
JSON containing embedded audio samples can be large. The application loads only audio formats supported by your browser. Playback requires a user gesture in most browsers. WAV rendering can be memory-intensive for long sequences.

## License
Song Maker+ original code is released under MIT (see LICENSE). Chrome Music Lab is a separate Google project. This app is unaffiliated with Google.