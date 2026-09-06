# Dartkoll

En enkel poängräknare för dart – **301**, **501** och **Farfar** – byggd för att
läggas i ett GitHub-repo och publiceras med GitHub Pages. Den går att installera
på iPhone, Samsung och surfplatta och fungerar utan nät.

Ingen inloggning, ingen server, inga cookies. Allt (pågående match, historik,
statistik) sparas lokalt i telefonen.

---

## 1. Lägg upp den på GitHub Pages

Har du redan ett repo: kopiera in alla filer i det och hoppa till steg 1.4.

### 1.1 Skapa repot på github.com

Klicka **New repository**, ge det ett namn (t.ex. `dartkoll`), välj **Public**
och skapa det. Skapa **inte** någon README där – du har redan en.

### 1.2 Lägg filerna på din dator

Packa upp mappen så att `index.html` ligger **direkt** i mappen (inte i en
undermapp).

### 1.3 Första pushen

I en terminal, stående i mappen:

```bash
git init
git add .
git commit -m "Första versionen av Dartkoll"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/dartkoll.git
git push -u origin main
```

### 1.4 Slå på Pages

På github.com: **Settings → Pages**. Under *Build and deployment*:

* Source: **Deploy from a branch**
* Branch: **main** och mapp **/ (root)** → **Save**

Efter någon minut ligger appen på
`https://DITT-ANVÄNDARNAMN.github.io/dartkoll/`

Adressen fungerar även om repot ligger i en undermapp – alla länkar i appen är
relativa.

### 1.5 Nästa gång du ändrar något

```bash
git add .
git commit -m "Beskriv vad du ändrade"
git push
```

Pages uppdaterar sig själv efter en liten stund.

> **Viktigt när du ändrat kod:** höj `version` i `js/config.js` **och**
> `CACHE_VERSION` i `sw.js` (t.ex. `1.0.0` → `1.0.1`). Annars kan telefoner som
> redan installerat appen ligga kvar på den gamla versionen. När den nya
> versionen hämtats dyker en liten ruta upp i appen: *Ny version finns – Ladda om*.

---

## 2. Installera appen på telefonen

**iPhone / iPad:** öppna adressen i **Safari** (inte Chrome) → dela-ikonen →
**Lägg till på hemskärmen**.

**Android / Samsung (telefon och surfplatta):** öppna adressen i **Chrome** →
menyn (tre punkter) → **Installera app**.

Efter det startar Dartkoll som en vanlig app, i helskärm och utan adressfält.
Knappen **Installera** på startskärmen visar samma instruktioner.

---

## 3. Så här är det byggt

Inget byggsteg, inga beroenden, ingen npm. Det som ligger i repot är exakt det
som körs i telefonen – redigera en fil, pusha, klart.

```
index.html              sidan och ordningen på skripten
manifest.webmanifest    gör att appen kan installeras
sw.js                   service worker: offline + snabb start
css/styles.css          all styling
icons/                  appikoner (genereras av tools/make-icons.py)
js/
  config.js             version, kaffe-länk, max antal spelare
  storage.js            allt som sparas lokalt
  sound.js              ljud och vibration
  stats.js              matchresultat och statistik
  engine/
    segments.js         en pil = fält + multiplikator, samt utgångsförslag
    x01.js              reglerna för 301/501
    farfar.js           reglerna för Farfar
    match.js            match = inställningar + lista med kast
  ui/
    dom.js, setup.js, game.js, result.js, history.js, modals.js
  app.js                vilken skärm som visas och vad knapparna gör
tools/
  make-icons.py         genererar ikonerna
  test-engine.js        regeltester (node tools/test-engine.js)
  smoke.js              klickar igenom appen i en riktig webbläsare
```

### Det viktigaste greppet

En match sparar **inte** ställningen. Den sparar bara listan med kast, och
ställningen räknas fram från listan varje gång. Därför går det att ångra eller
ändra vilket kast som helst – även flera spelare tillbaka – och få en korrekt
ställning igen. Det är det `Rätta`-knappen använder.

---

## 4. Reglerna som är inbyggda

### 301 / 501

* Ner till exakt 0. Tre pilar per tur, tryck **Nästa** när turen är klar.
* **Tjock:** kastar du över noll räknas hela turen som 0 poäng.
* **Dubbel utgång** (val i menyn): sista pilen måste vara dubbel eller röd bull.
  Att lämna 1 poäng kvar blir tjock.
* Utgångshjälpen föreslår en väg ut när det finns en, anpassat efter hur många
  pilar du har kvar i turen.

### Farfar

* Runda 1 kräver 15 poäng, målet ökar med 5 per runda (runda 18 = 100).
* Du kastar med 3 pilar + alla pilar du sparat. Sparade pilar staplas utan tak.
* Målet nått → turen slut, resterande pilar sparas.
* **Röd bull (50)** avslutar turen direkt och sparar resten av pilarna, även om
  målet inte är nått. **Grön bull (25) är bara 25 poäng.**
* Pilarna tar slut utan att målet nås → utslagen.
* **Rundan spelas alltid färdigt.** Alla som lever när rundan börjar får kasta,
  så ingen vinner bara för att hen råkar stå sist i turordningen.
* Sista spelaren kvar vinner. Slås alla ut i samma runda vinner högsta poängen
  den rundan (delad vinst vid lika).
* **Tak på 100** (val i menyn): efter runda 18 vinner flest sparade pilar.

Vill du ändra siffrorna (starta på 20 i stället för 15, eller annan ökning) finns
de samlade i `js/config.js` under `farfar`.

---

## 5. Småsaker du kanske vill ändra

Allt ligger i `js/config.js`:

| Inställning | Vad den gör |
|---|---|
| `version` | visas längst ner på startskärmen |
| `showSponsor` | `false` tar bort kaffe-knappen helt |
| `sponsorUrl` | vart kaffe-knappen går |
| `maxPlayers` | max antal spelare i en match |
| `farfar` | startmål, ökning per runda och vilken runda taket slår in |

---

## 6. Testa lokalt

Öppna `index.html` direkt i webbläsaren fungerar för det mesta, men service
workern kräver en riktig adress. Starta en liten server i mappen:

```bash
python3 -m http.server 8000
```

och gå till `http://localhost:8000`.

Regeltesterna (behöver bara node, inga paket):

```bash
node tools/test-engine.js
```

Ikonerna görs om med (behöver Python och Pillow):

```bash
python3 tools/make-icons.py
```

---

## 7. Bra att veta

* All data ligger i telefonens webbläsarlagring. Rensar du webbläsardata
  försvinner historiken, och den delas inte mellan telefoner.
* Statistiken slår ihop spelare på namn – "Emil" och "emil" räknas som samma,
  "Emil H" som en annan.
* Historiken sparar de senaste 200 matcherna.
