# Schedule Risk

Schedule Risk adalah aplikasi analisis risiko jadwal berbasis Monte Carlo untuk planner, scheduler, dan risk analyst. Aplikasi ini berjalan sepenuhnya di browser, menyimpan workspace secara lokal, dan cocok untuk hosting statis seperti Cloudflare Pages.

## Highlights

- Workflow terpandu `Input -> Run -> Results -> Insights`
- Workspace local-first untuk multi-project dan multi-scenario
- Simulasi Monte Carlo dengan distribusi triangular
- Compare scenario untuk `P50`, `P80`, `P90`, contingency, dan pergeseran risk driver
- Export hasil ke `CSV`, `PNG`, dan `PDF`
- CSV import, template download, dan preset proyek
- Validation assistant dengan jump-to-row, dismiss, dan auto-fix dasar
- Mitigation register per aktivitas
- Calendar setup dengan `5/6/7` hari kerja, holiday dates, dan holiday override
- UI bilingual `Indonesia / English`

## Tech Stack

- React
- Vite
- Recharts
- jsPDF
- html-to-image
- Vitest
- Testing Library
- axe

## Local Development

Prasyarat:

- Node.js 18+
- npm 9+

Install dan jalankan:

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

Jalankan test:

```bash
npm test
```

## Deploy ke Cloudflare Pages

Project ini sudah disiapkan untuk direct upload ke Cloudflare Pages via Wrangler.

```bash
npm run cf:login
npm run cf:project
npm run build
npm run cf:deploy
```

Untuk preview branch:

```bash
npm run build
npm run cf:deploy:staging
```

Lihat konfigurasi di [wrangler.toml](./wrangler.toml).

## Struktur Proyek

```text
src/
  App.jsx
  App.css
  components/
    Header.jsx
    WorkspacePanel.jsx
    InputTab.jsx
    ResultsTab.jsx
    ChartsTab.jsx
    SensitivityTab.jsx
    CompareSection.jsx
  hooks/
    useWorkspaceModel.js
    useWorkspaceActions.js
    useScenarioRunState.js
    useSimulationActions.js
    useStageNavigation.js
  utils/
    simulation.js
    workspace.js
    import.js
    compare.js
    report.js
    templates.js
```

## Data Model Ringkas

- `Project`: metadata project, `calendarConfig`, kumpulan `scenarios`
- `Scenario`: iterations, activities, notes, dan `lastRunSummary`
- `Activity`: O/M/P, dependency, lag, progress, remaining duration, dan mitigation fields

## Catatan Modeling

- Dependency yang didukung saat ini: `FS` dan `SS`
- Holiday override masih diperlakukan sebagai allowance global
- Belum ada CPM editor atau scheduling kalender penuh
- Tidak ada backend; data tersimpan di browser user

## Quality Status

- `npm test` lulus
- `npm run build` lulus
- Accessibility check otomatis via `axe`
- Results, compare, charts, sensitivity, dan report diekstrak ke lazy-loaded chunks

## Roadmap

1. Dependency realism yang lebih kuat, termasuk multi-predecessor dan validasi logic yang lebih kaya
2. Import awal dari Primavera P6 atau MS Project
3. Report export yang lebih kaya dengan lampiran chart per scenario
4. Portfolio view dan fitur collaboration setelah workflow local-first matang
