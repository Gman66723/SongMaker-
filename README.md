# Song Maker+

A browser-based music sequencer with the recognizable white grid, rainbow notes, and cyan transport controls inspired by Chrome Music Lab Song Maker. **This is an independent implementation, not a fork of Google's proprietary Song Maker source, and is not affiliated with Google.**

## Make music

- Tap or drag across the melody grid to place notes.
- Use the two percussion lanes for hi-hats and kick drums.
- Change the melody sound with the **Instrument** selector.
- Click **Tracks** to create melodies, drum tracks, and sample tracks; change track volume, mute, or solo them.
- Click **Upload** to load an audio file (WAV, MP3, or OGG, under 20 MB) into a sample track.
- Click **Settings** to change song length, volume, or WAV export repeats.
- Click **Save** to save a JSON project that includes uploaded audio.
- Click **Export WAV** to render an audio file in your browser.
- Press the Spacebar to play or stop when a text entry control is not active.

Everything runs in your browser without a backend or account. Projects and uploaded sounds are not uploaded to a server. Serve these files as static assets (including on GitHub Pages).

## Design skill

The reusable agent skill [Google Song Maker web style](skills/google-song-maker-web-style/SKILL.md) defines the visual appearance, interface-writing and accessibility guidelines, HTML/CSS conventions, and test checklist used for this page. It draws on:

- [Chrome Music Lab Song Maker](https://musiclab.chromeexperiments.com/Song-Maker/) as the **visual reference**.
- [Google developer documentation style guide](https://developers.google.com/style) for UI wording and accessibility.
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html) for code conventions.

Google's developer documentation guide is primarily **editorial**, not a website theme. The skill uses the actual Chrome Music Lab UI to preserve the requested look.

## Development

- Open `index.html` in a browser or serve the directory using any static server.
- Run `node --check app.js` to check JavaScript syntax.
- UI uses plain HTML, CSS, and JavaScript with Web Audio API; no dependencies or build step.

## Credits and license

Independent, noncommercially branded Song Maker-inspired implementation. No Chrome Music Lab source code or Google visual assets are included. This project's source is licensed under MIT; see [LICENSE](LICENSE).