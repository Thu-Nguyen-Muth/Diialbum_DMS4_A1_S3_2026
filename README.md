# Diialbum

A cozy photo-album website. Open **index.html** in Chrome or Edge (Firefox and Safari also work).

## Folder contents
```
Diialbum/
├── index.html        page structure
├── css/style.css     all styles (light/dark themes, album, panels)
├── js/app.js         all features (album, layers, drawing, stickers, weather, music, export…)
└── assets/
    ├── favicon.svg   tab icon
```

## Good to know
- Keep the four items together in this folder: index.html needs css/, js/ and assets/ next to it.
- Your albums, photos and settings are saved in this browser on this device (IndexedDB).
- Internet is used only for: handwriting fonts (Google Fonts) and live weather (Open-Meteo).
  Without internet the app still works with fallback fonts and a calm default sky.
- Built-in stickers, emoji stickers, music and sound effects are generated in code, so no extra
  image or audio files are needed.
- Music starts after your first click on the page (browsers block autoplay).
