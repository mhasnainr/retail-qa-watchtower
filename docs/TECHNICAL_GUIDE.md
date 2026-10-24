# Technical guide — Retail QA Watchtower

[Back to the plain-language README](../README.md)

These notes are for developers and reviewers who want setup commands, storage details and testing information. No coding is needed to try the downloaded demo.

An independent retail QA training portfolio: observe an illustrated event, compare the supporting records, record a finding, and produce a complete daily handover.

**All content is synthetic.** This project was not developed for, commissioned by, or endorsed by Active8 Wireless, Metro by T-Mobile or any other employer. It contains no real CCTV, employee information, customer contact data or company SOPs. The rules are explicitly fictional training rules.

## Why this exists

A package leaving a store is an observation, not a conclusion. A useful QA record needs the source, event time, authorization check, uncertainty and next action. This offline prototype makes that process inspectable, including the finding and closure history.

Version 2 repairs the original demo's incomplete handover and unsupported evidence labels. Reports now include event timestamps, a declared reporting day, older unresolved cases, every incident in scope and a stated excluded count. Reviews require supporting records and recorded outcomes where appropriate.

## Run the application

1. Extract the entire folder.
2. Open `index.html` in a modern browser with JavaScript enabled. Keep `styles.css`, `data.js`, `core.js`, `store.js` and `app.js` beside it.
3. Start with **Observation Desk**. The included fictional scenarios are dated **24 October 2026**; the report initially selects that day.

No installation, signup, paid API, backend or internet connection is required for the application. Direct file launch and saving were checked in the Chromium build named in [the execution record](../test-results/browser-results.json). Storage behavior for `file:` pages varies by browser. If storage is unavailable, the app explains the failure and offers an explicit temporary session; export JSON before closing a temporary tab.

For a consistent local origin, use Node.js 22 or later:

```sh
npm run serve
```

Open `http://127.0.0.1:8080`. This local server uses Node built-ins; application dependencies do not need to be installed. The app can also be served by any static host.

## Walkthrough

1. **Observation Desk:** play or step through three distinct illustrated sequences. Write an observation in your own words; facts are not prefilled. Optional guidance is labeled.
2. **Incident Register:** record store, camera/source, observation time and timezone, recorder, facts and next action. Creation time is stored separately in UTC.
3. **Evidence & Cases:** inspect actual fictional dispatch, exit, POS, approval-search, receipt, return and callback records. Worked examples are answer keys, not client results or independent assessments.
4. **Review / history:** qualify evidence using matching record IDs and a specific finding. Record a recipient when escalating. Resolution requires qualified evidence, reviewer, supporting records, outcome and time. Reopening and corrections retain prior history and original facts.
5. **QA Task Queue:** record the comparison, reviewer, review result and escalation recipient, rather than only changing a status.
6. **Daily Report:** choose and **save** the analyst, reporting date and timezone. The report includes all observations in that day and older unresolved cases, ordered with High priority first. Future observations and older resolved cases are excluded with an explicit count. The task queue is labeled a current snapshot, not daily throughput.
7. **Export:** incident/task CSV, text handover or JSON backup. Print produces a handover-only layout.

The six-question judgment exercise reinforces record-based reasoning. It does not certify CCTV monitoring ability or job readiness.

## Complete synthetic cases

| Case | Comparison | Defensible outcome |
|---|---|---|
| Authorized transfer | Package, quantity, destination and time match; approval precedes movement | No deviation found in the supplied records; retain the comparison and close. |
| 40% discount | $80 / $200 × 100 = 40%; limited approval extract has no matching entry | Request authorization and escalate the evidence gap; do not infer intent. |
| Return mismatch | Transaction, quantity and $25 match; item codes differ | Document the mismatch and request clarification. |

See [worked case files](CASE_FILES.md) and [supporting records](../data/SOURCE_RECORDS.json). The [sample handover](SAMPLE_HANDOVER.txt) is generated from the fictional starting state, with a fixed, clearly labeled preparation time.

## Data integrity and recovery

- Every operation is stored under a unique local-storage key. Independent additions in multiple tabs do not overwrite one shared snapshot.
- Browsers with Web Locks serialize commits. Without Web Locks, the operation journal still preserves independent additions; version checks and deterministic replay identify conflicting reviews. Conflicting operations are retained and surfaced for inspection, not silently applied.
- Storage events refresh other tabs. An open review keeps its original version, so submitting a stale review is rejected while its draft remains available.
- Invalid stored entries are excluded from rendering and retained verbatim in **Export recovery data**. The app does not silently replace corrupt data.
- Legacy `qa-watchtower-v1` data is preserved. The explicit migration validates incidents, reopens unsupported old evidence/closure labels for review, records the original labels, and interprets old local times in the viewer's supported timezone. Confirm imported timezones. The full original task data remains in recovery export; the new task templates start from the fictional baseline because old task statuses had no attributable review history.
- **Reset synthetic demo** creates a new active generation. Earlier operations remain in JSON backups. A reset is not secure deletion. Existing JSON backup files are inspectable recovery artifacts; an automated JSON restore/import interface is not provided.
- Browser storage and this history are editable by the device owner. Neither is a tamper-proof audit system. Clearing browser/site data can remove the local journal; keep backups.

## CSV handling

The committed `SAMPLE_INCIDENTS.csv` uses exactly the same columns and seed values as the application's incident export. CSV text is quoted correctly. Formula-leading values (including whitespace/control prefixes and full-width formula characters) receive a leading apostrophe so the generated field does not start with a formula marker. The JSON backup retains the original values losslessly.

CSV interpretation varies among spreadsheet applications and after saving/reopening. Import columns explicitly as **text** and inspect untrusted exports; no universal spreadsheet-safety guarantee is claimed. The execution record verifies the exported bytes, not Excel/LibreOffice formula execution.

## Testing

The application itself has no third-party runtime dependencies. The browser tests use a pinned Playwright development dependency.

```sh
npm ci
npx playwright install chromium
npm test
```

On Linux systems missing browser libraries, use `npx playwright install --with-deps chromium` in an appropriate development/CI environment. To test an already installed Chromium binary:

```sh
CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium npm run test:browser
```

Individual commands:

```sh
npm run test:unit
npm run test:browser
npm run fixtures
```

`fixtures` regenerates the sample CSVs, complete synthetic source data, worked examples and sample handover from `data.js` and the shared domain rules. Browser tests write a dated execution record to `test-results/browser-results.json`. Generated diagnostic print files stay under the ignored `test-results/internal/` folder.

Read [the test plan](TEST_PLAN.md), [the review resolution matrix](REVIEW_RESOLUTION.md), and [the validation report](VALIDATION.md) for scope and results. The GitHub Actions workflow runs the suites on push or pull request; its execution status must be checked separately from the included local results.

## Project files

| Path | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | Accessible interface, responsive layout and interactions. |
| `core.js` | Validation, time conversion, review rules, journal replay, reporting and CSV encoding. |
| `store.js` | Local operation journal, conflict handling, temporary mode and legacy migration. |
| `data.js` | Fictional stores, source records, rules, starting incidents/tasks and case answer keys. |
| `SAMPLE_INCIDENTS.csv`, `data/` | Export-schema example and complete inspectable fictional records. |
| `docs/` | Cases, sample handover, test plan, defect fixes and validation evidence. |
| `tests/`, `test-results/` | Reproducible domain/browser tests and actual execution records. |
| `tools/`, `package.json`, `package-lock.json` | Local server, fixture generation and pinned development setup. |
| `.github/workflows/qa.yml` | Automated domain/browser checks. |

## Limits and honest portfolio positioning

This is a self-created, AI-assisted training prototype. It is suitable as supporting evidence of structured retail/operations QA reasoning. It is not employer work experience, a production evidence system, an AI surveillance product or proof of improved loss-prevention results.

There is no video ingestion, identity recognition, live integration, authentication, production access control, retention enforcement, secure evidence upload, API or database. Real employer rules are unknown. The illustrated sequences do not establish sustained real-world monitoring ability. The repository also demonstrates software testing through executed cases and reproducible defects/fix checks; it does not demonstrate API or SQL testing.

The completed local checks and their browser/version limits are recorded in `docs/VALIDATION.md`. Firefox, Safari, real-device usability, full screen-reader/accessibility conformance and production security have not been certified.

## Maintaining the beginner documentation

The main README uses GitHub-supported expandable sections, jump links and local images. GitHub does not run the standalone guide's JavaScript within a README. Users download the project and open `START_HERE.html` for its Next/Back walkthrough, practice decision and optional animation.

Four SVG diagrams and one six-frame GIF are committed under `docs/images/`. They are exact workflow illustrations, not screenshots or representations of real CCTV. To regenerate them, run `python3 tools/generate-doc-images.py` from the project folder. Python's standard library generates the SVGs; Pillow is required for the GIF (`python3 -m pip install Pillow`). These are documentation-maintenance dependencies, not application requirements.

The static server serves the diagrams and GIF with their correct image types. Documentation checks are recorded in [DOCUMENTATION_CHECKS.md](DOCUMENTATION_CHECKS.md). The application's 67-test execution record remains separate from documentation checks.

