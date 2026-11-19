# Getaway in Hamina – siirto Cloudflare Workersiin ja pistetaulukko

Tämä kansio sisältää kaiken, mitä GitHubiin tarvitaan:

```
getaway-in-hamina/
├── public/index.html   ← itse peli
├── src/worker.js       ← pistetaulukon palvelin
├── wrangler.jsonc      ← Cloudflaren asetukset
└── README.md
```

## 1. Luo tietokanta Cloudflareen (2 min)

1. Cloudflaren hallintapaneeli → **Storage & Databases → D1 SQL Database → Create**.
2. Nimeksi `getaway-scores` → **Create**.
3. Kopioi avautuvalta sivulta **Database ID** (pitkä tunnus, muotoa `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

Taulukoita ei tarvitse luoda itse – palvelin tekee ne automaattisesti ensimmäisellä käyttökerralla.

## 2. Päivitä GitHub-repo (5 min)

1. Avaa nykyinen repo GitHubissa.
2. Poista vanha juuressa oleva `index.html` (avaa tiedosto → kolme pistettä → **Delete file** → Commit).
3. **Add file → Upload files** ja raahaa koko `getaway-in-hamina`-kansion **sisältö** (kansiot `public` ja `src` sekä tiedostot `wrangler.jsonc` ja `README.md`). GitHub säilyttää kansiorakenteen, kun raahaat kansiot.
4. **Commit changes**.
5. Avaa repossa `wrangler.jsonc` → kynä-ikoni (Edit) → korvaa teksti `LIITA-TAHAN-DATABASE-ID` vaiheessa 1 kopioimallasi Database ID:llä → **Commit changes**.

## 3. Luo Worker Cloudflareen (3 min)

1. **Workers & Pages → Create → Workers**-välilehti → **Import a repository** (Connect to Git).
2. Valitse sama GitHub-repo.
3. Asetukset:
   - Project name: `getaway-in-hamina`
   - Build command: *jätä tyhjäksi*
   - Deploy command: `npx wrangler deploy` (yleensä valmiina)
4. **Deploy**.

Minuutin päästä peli toimii osoitteessa `getaway-in-hamina.<tunnuksesi>.workers.dev`, ja alkuvalikossa näkyy **🏆 Pistetaulukko**.

## 4. Vanha Pages-projekti

Kun Worker toimii, poista vanha Pages-projekti (Workers & Pages → projekti → Settings → **Delete**), jotta GitHubin päivitykset eivät mene kahteen paikkaan. Jos haluat käyttää jatkossa samaa lyhyttä osoitetta, voit liittää Workeriin oman verkkotunnuksen kohdasta **Settings → Domains & Routes**.

## Pelin päivittäminen jatkossa

Kun peliin tulee muutoksia: GitHubissa avaa kansio `public` → **Add file → Upload files** → raahaa uusi tiedosto nimellä **index.html** → Commit. Cloudflare julkaisee päivityksen automaattisesti.

## Miten pistetaulukko toimii

- Kun poliisi saa kiinni (pakoaika vähintään 5 s), kiinniottoruudussa kysytään nimimerkkiä ja painetaan **🏆 Tallenna**.
- Listalla näkyy kymmenen parasta, kustakin nimimerkistä paras aika.
- Huijausten estoksi palvelin tarkistaa, että jahti on oikeasti aloitettu ja että ilmoitettu aika mahtuu aloituksesta kuluneeseen todelliseen aikaan. Yhtä jahtia ei voi tallentaa kahdesti, ja IP-osoitetta kohden on rajoitettu yritysten määrä.
- Avattaessa peli suoraan tiedostona (ei Cloudflaresta) pistetaulukko on piilossa, ja peli toimii muuten normaalisti.
