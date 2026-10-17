# RoleBravery - LoL Custom Game Balancer & Bravery Draft

Eine moderne Webapplikation für League of Legends Custom Games, die Spieler automatisch in ausgeglichene 5v5-Teams aufteilt und ihnen rollenspezifische Champions nach dem **"Bravery"-Prinzip** (Zufallspick) zuweist.

---

## Features

### 1. Spieler-Eingabe (Backend-Panel)
- **Skalierbar**: Unterstützt 10, 20, 30 oder mehr Spieler. Spieler werden automatisch in 10er-Blöcke (Match 1, Match 2, etc.) eingeteilt. Überschüssige Spieler werden in der Ersatzbank verwaltet.
- **Schnelleingabe**: Spielername eingeben und mit `Enter` direkt hinzufügen.
- **Massen-Import**: Namen aus Discord/Textlisten per Copy & Paste einfügen (ein Spieler pro Zeile).
- **Elo-Rating**: Konfigurierbare Elo-Gewichtung (`Low` = 1, `Mid` = 2, `High` = 3).
- **Rollen-Filter**: Toggles für erlaubte Rollen (`Top`, `Jungle`, `Mid`, `ADC`, `Support`). Mindestens eine Rolle bleibt immer aktiv.
- **Individuelle Bans**: Jeder Spieler kann persönliche Champion-Bans festlegen, die er beim Zufallspick nicht erhalten darf.
- **Lokale Persistenz**: Alle Daten (Spieler, Rollen, Bans, Elo und Pools) bleiben automatisch im `LocalStorage` gespeichert.

### 2. Matching- & Draft-Algorithmus
- **Elo-Balancing**: Berechnet aus allen 252 Kombinationen (10 über 5) die Teamaufteilung auf Blue Side und Red Side mit minimaler Differenz im Gesamt-Elo-Score.
- **Bipartite Rollen-Zuweisung**: Backtracking-Algorithmus garantiert, dass jeder Spieler eine seiner gewählten Rollen erhält und keine Rolle im Team doppelt besetzt ist (1 Top, 1 Jungle, 1 Mid, 1 ADC, 1 Support).
- **Bravery-Champion-Zuteilung**:
  - Rollenspezifischer Zufallspick aus dem hinterlegten Rollen-Pool.
  - Berücksichtigung individueller Spieler-Bans.
  - Keine doppelten Champions innerhalb desselben Teams.
- **Rerolls**:
  - Individueller Champion-Reroll pro Spieler (Klick auf den Würfel auf der Spielerkarte).
  - "Champions Reroll": Würfelt alle Champions neu aus, behält Teams und Rollen bei.
  - "Match Neu": Würfelt das gesamte Match komplett neu (Teams, Rollen, Champions).

### 3. Stream / Visual Ansicht (Broadcast Overlay)
- **16:9 Optimiert**: Perfekt für Desktop-Vollbild (`F11`) oder OBS Browser Source.
- **LCK / LEC Esport Ästhetik**:
  - Links: **Blue Team** (5 vertikale Slots: Spielername, Elo-Badge, Rollen-Icon, Bravery Champion mit Artwork).
  - Rechts: **Red Team** (5 vertikale Slots im gespiegelten Design).
  - Mitte: **VS-Badge**, Elo-Differenz-Anzeige und Balance-Balken.
- **Pagination**: Blättern zwischen Match 1, Match 2, etc. per Klick oder Tastatur (`◄` / `►`).
- **Discord-Export**: 1-Klick-Button zum Kopieren der vollständigen Match-Aufstellung in die Zwischenablage.
- **OBS Overlay Modus**: Randloser Modus ohne Navigation für sauberes Streaming-Capture.

### 4. Champion-Daten & JSON-Konfiguration
- Enthält standardmäßig alle Champions nach den fünf Rollen sortiert.
- Über den Button **"Pool JSON"** kann jederzeit eine eigene bereinigte JSON mit den fünf Rollen-Arrays (`top`, `jgl`, `mid`, `adc`, `sup`) eingefügt oder angepasst werden.

---

### 5. Lobby & Turniermodus
- **Hauptmenü / Lobby**: Modus wählen (Turnierformat oder „Klassisch“), Teilnehmer eintragen, Turnier starten.
- **Fillmasters x Squid Game** (20 Spieler):
  1. **Runde 1** – 4 Elo-balancierte 5v5-Teams (A–D), Matchups gelost (Match 1, Match 2), Bravery.
  2. **Runde 2** – die 10 Sieger werden neu gemischt (Team E vs Team F, Match 3), Bravery.
  3. **Wildcard** – animiertes Glücksrad zieht 1 der 5 Sieger, direkt fürs Finale gesetzt.
  4. **Halbfinale** – die übrigen 4 als zufällige Duos, 2v2, freie Champion-Wahl.
  5. **Duo-Duell** – 1v1 im Gewinner-Duo, der Sieger ist Finalist.
  6. **Finale** – Finalist vs Wildcard, 1v1. Der Sieger ist der **Fillmaster** (Sieger-Screen mit Konfetti).
- Sieger anklicken → die nächste Phase wird automatisch gelost.
- **Rückgängig** macht die letzte Aktion rückgängig (Sieger, Glücksrad, Reroll).
- **Rerolls** (Phase neu losen, Champions neu, einzelner Champion) sind möglich, solange in der Phase bzw. dem Match noch kein Ergebnis steht.
- **Turnierbaum** im Control-Panel und im Overlay: Ausgeschiedene sind ausgegraut, Sieger hervorgehoben.

### 6. OBS-Overlay & Live-Sync (Firebase)
- Control-Panel: `https://draft.namophoenix.com/?room=<id>`. Die Raum-ID wird automatisch erzeugt und gemerkt.
- Overlay für OBS: `…/?room=<id>&overlay=1` (Button **„OBS-Link kopieren“**). Das Overlay ist randlos, read-only und auf 1920×1080 skaliert.
  - Mit `&bg=transparent` ist der Hintergrund transparent.
- Im Control-Panel umschaltbar: Overlay zeigt **Aktuelles Match** oder **Turnierbaum**.
- Sync über die **Firebase Realtime Database** (`rooms/<id>`). Ohne Firebase-Config läuft alles lokal (LocalStorage). Das Overlay funktioniert dann nur im selben Browser.
- Die lange, zufällige Raum-ID ist der Zugriffsschutz: Wer den Link kennt, kann lesen und schreiben. Den Link nicht öffentlich posten.

---

## Neues Turnierformat anlegen

Formate sind reine Daten (`src/formats/`), die Engine (`src/engine/tournament.ts`) muss nicht angepasst werden.

1. Datei anlegen, z. B. `src/formats/season2.ts`:

```ts
import { TournamentFormat } from './types';
import { teamDraft5v5, duel1v1, wheelPick, fromEntrants, winnersOf, losersOf, pickedFrom } from './presets';

export const season2: TournamentFormat = {
  id: 'season-2',                       // eindeutig
  name: 'Season 2: Redemption',
  tagline: '10 Spieler',
  entrants: { min: 10, max: 10 },       // erlaubte Teilnehmerzahl
  championTitle: 'Champion',
  phases: [
    teamDraft5v5('r1', 'Runde 1', [fromEntrants()]),
    wheelPick('mvp', 'MVP-Rad', [winnersOf('r1')], { pickedLabel: 'MVP' }),
    wheelPick('lucky', 'Zweite Chance', [losersOf('r1')], { pickedLabel: 'Lucky Loser' }),
    duel1v1('final', 'Finale', [pickedFrom('mvp'), pickedFrom('lucky')]),
  ],
};
```

2. In `src/formats/index.ts` zu `TOURNAMENT_FORMATS` hinzufügen. Es erscheint dann automatisch in der Lobby.

**Bausteine:**

| Phase | Bedeutung |
|---|---|
| `kind: 'match'` | Spieler werden in Teams à `teamSize` aufgeteilt (`grouping: 'eloBalanced' \| 'random'`), Teams werden zufällig gepaart (2 pro Match). `championMode: 'bravery' \| 'freePick'`. 5er-Teams bekommen Rollen. |
| `kind: 'wheel'` | Glücksrad zieht `pickCount` Spieler. |

Presets: `teamDraft5v5`, `duo2v2`, `duel1v1`, `wheelPick`. Optionale Felder sind `teamNames`, `matchLabels`, `subtitle` und `pickedLabel`.

**Quellen (`sources`)** – woher die Spieler einer Phase kommen (mehrere werden zusammengeführt):

| Quelle | Spieler |
|---|---|
| `fromEntrants()` | alle Teilnehmer |
| `winnersOf(id)` / `losersOf(id)` | Spieler der Sieger- bzw. Verlierer-Teams einer Match-Phase |
| `pickedFrom(id)` / `restOf(id)` | Gezogene bzw. nicht Gezogene eines Glücksrads |
| `{ phase: id, take: 'all' }` | alle Teilnehmer einer Phase |

Eine Phase wird automatisch gelost, sobald alle ihre Quellen feststehen. Die **letzte Phase ist das Finale**, ihr Sieger bekommt den `championTitle`. Wer verliert und von keiner späteren Phase (`losersOf`) aufgenommen wird, gilt als ausgeschieden.

---

## Live-Sync einrichten (Firebase + GitHub Pages + OBS)

1. **Firebase-Projekt** anlegen: https://console.firebase.google.com → „Projekt hinzufügen“ (Google Analytics ist nicht nötig). Der Spark-Plan (kostenlos) reicht.
2. **Realtime Database** aktivieren: Build → Realtime Database → „Datenbank erstellen“ → Standort z. B. `europe-west1` → „Im gesperrten Modus starten“.
3. **Rules** einfügen: Realtime Database → Tab „Regeln“ → Inhalt von [`database.rules.json`](database.rules.json) einfügen → „Veröffentlichen“.
4. **Web-App** registrieren: Projekteinstellungen (Zahnrad) → Allgemein → „Meine Apps“ → Web (`</>`) → Name vergeben (kein Hosting nötig). Die angezeigte `firebaseConfig` notieren.
5. **Lokal**: `.env.example` nach `.env` kopieren und `apiKey`, `authDomain`, `databaseURL`, `projectId` und `appId` eintragen. `databaseURL` steht oben auf der Realtime-Database-Seite. Dann `npm run dev` bzw. `npm run build`.
6. **GitHub Pages**: Im Repo unter Settings → Secrets and variables → Actions → Tab **Variables** dieselben fünf Werte als Repository-Variablen anlegen (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`). Danach auf `main` pushen. Der Workflow `.github/workflows/deploy.yml` baut und deployt automatisch.
   - Die Firebase-Web-Config ist kein Geheimnis, sie landet ohnehin im ausgelieferten JS. Der Schutz kommt von den Rules und der geheimen Raum-ID.
7. **OBS**: Die App öffnen → Lobby → **„OBS-Link kopieren“**. In OBS: Quelle hinzufügen → **Browser** → URL einfügen.
   - Breite **1920**, Höhe **1080**, „Audio über OBS steuern“ nach Wunsch.
   - Transparenter Hintergrund: `&bg=transparent` an die URL hängen.
   - Wichtig: Das Control-Panel immer mit derselben `?room=`-URL öffnen. Der OBS-Link bleibt gleich, solange du keinen „Neuen Raum“ anlegst.

---

## Entwicklung & Start

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production-Build erstellen
npm run build
```
