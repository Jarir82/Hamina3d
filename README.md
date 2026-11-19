# Getaway in Hamina

GTA-tyylinen 3D-selainpeli Haminassa. Julkaistu Cloudflare Workersina; poliisijahdin pistetaulukko on D1-tietokannassa.

- `public/index.html` – itse peli (päivitä tämä tiedosto, kun peliin tulee muutoksia)
- `src/worker.js` – pistetaulukon palvelin (`/api/scores`, `/api/start`, `/api/score`)
- `wrangler.jsonc` – Cloudflaren asetukset (D1-tietokannan ID)

Karttadata © OpenStreetMap contributors (ODbL). Korkeusmalli: Copernicus DEM.
