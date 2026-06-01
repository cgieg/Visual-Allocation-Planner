# 📊 Visual Resource Planner

Ein hochgradig interaktives, modernes und visuell ansprechendes Single-Page-Tool zur **Ressourcenplanung, Projekt-Pipeline-Verfolgung und Rekrutierungssteuerung** in Echtzeit.

Entwickelt für agile Teams, PMOs und Leads, die eine intuitive Drag-and-Drop-Schnittstelle benötigen, um Teammitglieder auf Projekte zu verteilen, Soll-Ist-Kapazitäten zu analysieren und Einstellungskorridore im Blick zu behalten.

---

## ✨ Hauptfeatures (Core Capabilities)

### 1. 🎛️ Interaktives Whiteboard & Drag-and-Drop
* **Ressourcen-Pool:** Eine dynamische Übersicht aller Mitarbeiter inklusive Auslastungsanzeige (FTE in %) und aktuellen Rollen.
* **Intelligente Allokation:** Ziehe Mitarbeiter per Drag-and-Drop aus dem Pool direkt in Projekte, um sie zuzuordnen.
* **Überlastungswarnung:** Mitarbeiter, die über 100 % ausgelastet sind, werden farblich hervorgehoben (Rot), um Überlastungen sofort zu erkennen.

### 2. 📋 Kapazitäts- & Bedarfsanalyse (Vakanzen-Tracking)
* **Soll-Besetzung definieren:** Lege direkt in jedem Projekt fest, welche Rollen (z.B. Frontend-SWE, PO, UX) mit wie viel FTE-Kapazität benötigt werden.
* **Automatische Vakanzberechnung:** Das System vergleicht die Soll-Vorgaben mit den tatsächlichen Allokationen und zeigt offene Bedarfe an (z.B. `SWE Backend: 50% offen`).
* **Zentrales Analyse-Widget:** Ein einklappbares Dashboard aggregiert alle offenen Vakanzen über alle Projekte hinweg mit detaillierter Projektzuordnung.
* **Globaler Header-Indikator:** Ein dynamisches Dropdown zeigt übergreifend die Auslastungs- und Vakanz-Quoten für den aktiven Pool sowie die Pipeline.

### 3. 🌿 Projekt-Pipeline (Kanban-Board)
* **Visualisierte Pipeline:** Verfolge neue Projektchancen von der **Opportunity** über das **Angebot (Proposal)**, **Go/No Go Entscheidungen** und das **Staffing** bis hin zum **Kickoff**.
* **Nahtlose Beförderung:** Sobald ein Projekt bereit ist, lässt es sich per Klick direkt in den aktiven Projekt-Pool übernehmen – inklusive aller bereits definierten Soll-Besetzungen und Rollenprofile.

### 4. 🎯 Recruiting-Board
* Ein dediziertes Board zur Verfolgung von Job-Kandidaten durch den gesamten Einstellungskreislauf: **Sourcing**, **Interview**, **Offered**, **Pre-Boarding** und **Gestartet**.

### 5. ⚠️ Intelligente Validierung & Rollenkontrollen
* **Manuelle Tech-Lead-Steuerung:** Bestimme Teammitglieder gezielt per Checkbox als Tech-Lead.
* **Sicherheitswarnungen:** Hat ein Projekt zwei oder mehr Software-Entwickler (SWEs) allokiert, aber keinen definierten Tech-Lead? Das System warnt dich sofort visuell durch einen pulsierenden bernsteinfarbenen Rahmen um das Projekt und einen Warnhinweis (`⚠️ Kein Tech-Lead`).

### 6. 🍏 macOS & Safari Optimierung
* Komplett bereinigt von Browser-Bugs bezüglich verschwindender Mauszeiger unter macOS (Chrome/Safari) dank moderner Event-Steuerung und Hardware-beschleunigter Render-Backdrops.

---

## 🛠️ Technologie-Stack

* **Framework:** React 18 mit TypeScript (robust typisiert)
* **Build-Tool:** Vite (für ultraschnelle Entwicklung und Builds)
* **Styling:** Tailwind CSS (modernes UI-Design mit ansprechenden Animationen und harmonischen Farbpaletten)
* **Drag-and-Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
* **Icons:** `lucide-react`
* **Zustandsverwaltung:** Zustand / Custom React Store (mit Vorbereitung auf LocalStorage-Persistenz)

---

## 🚀 Schnellstart (Quick Start)

### Voraussetzungen
Stelle sicher, dass du [Node.js](https://nodejs.org/) (Version 18 oder neuer empfohlen) auf deinem System installiert hast.

### 1. Installation
Klone das Repository und installiere die benötigten Abhängigkeiten:
```bash
git clone https://github.com/cgieg/Visual-Allocation-Planner.git
cd Visual-Allocation-Planner
npm install
```

### 2. Entwicklungs-Server starten
Starte den lokalen Server für die Live-Entwicklung:
```bash
npm run dev
```
Öffne anschließend [http://localhost:5173](http://localhost:5173) in deinem Browser.

### 3. Produktions-Build erstellen
Kompiliere und optimiere die Anwendung in eine einzelne, standalone HTML-Datei (Single-Page-Application):
```bash
npm run build
```
Der fertige Build befindet sich anschließend im Verzeichnis `dist/index.html` und kann auf jedem statischen Webserver gehostet werden.

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert. Siehe die [LICENSE](LICENSE) Datei für Details.
