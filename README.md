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

## Entwicklung & Start

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production-Build erstellen
npm run build
```
