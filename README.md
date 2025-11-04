# RefaVis – Visualization-Driven Refactoring Explorer

RefaVis is an interactive React + Vite + Tailwind dashboard that helps surface refactoring candidates in large code bases.  
The app focuses on two perspectives:

1. **Preset-driven function curation** – choose between complexity, severity, or easy-to-fix presets to reveal curated filter controls and ranked function cards.
2. **Call graph context** – see the selected function and its one-hop relationships highlighted directly in a D3-based call graph.

This repository contains only the frontend. All data is mocked locally (`src/mockData.json`) so the UI can be demonstrated without a backend.

---

## Features

- 🧭 **Preset selector**: Switch between “복잡도 높은 함수”, “심각한 경고가 많은 함수”, and “고치기 쉬운 경고가 많은 함수”. Each preset exposes relevant filters in the left panel.
- 🎚️ **Dynamic filters**: Filter by warning count, complexity, severity, degree, and easy-fix density. Cards update immediately.
- 🧩 **Function cards**: Consistent Tailwind styling with hover/selection states, quick detail links, and severity chips.
- 🕸️ **Call graph highlighting**: Clicking a card (or node) highlights the function and its neighbors using the project’s primary blue palette.
- 📱 **Responsive layout**: Left panel can collapse via the edge toggle so the graph can take the full viewport.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested with Node 20)
- npm 9+ (ships with recent Node versions)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`). Hot Module Reloading is enabled by default.

### Production Build

```bash
npm run build
```

The output is written to `dist/`. To preview the production bundle locally:

```bash
npm run preview
```

---

## Project Structure

```
src/
├─ components/
│  ├─ CallGraph.jsx        # D3 graph with highlight states
│  └─ …                    # Layout + shared UI parts
├─ pages/
│  └─ WarningsPage.jsx     # Main RefaVis experience
├─ mockData.json           # Mock warnings, functions, graph nodes/edges
├─ mockData.js             # Utility exports derived from the JSON
└─ main.jsx / App.jsx      # App entry
```

We use **JavaScript** (no TypeScript) with modern ES modules and JSX.

---

## Customization Tips

- **Data**: Replace `src/mockData.json` with real analysis output. Keep the same schema (warnings/functions/nodes/edges) or update `mockData.js`.
- **Branding**: Tailwind classes live directly inside the JSX. Update theme colors in `tailwind.config.js` if you want global palette changes.
- **Future panels**: There is a placeholder note in the left panel for a future “Function Detail” pane. Add a new component in `components/` and mount it next to the call graph when ready.

---

## License

This project inherits the license of your parent repository. Update this section if you need to distribute RefaVis under a specific license.
