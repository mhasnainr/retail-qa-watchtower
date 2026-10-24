# Validation record — version 2.0.0

Actual browser execution completed at **2026-10-24T18:35:08.903Z** (UTC; add five hours for Asia/Karachi). Domain execution is recorded in the included JUnit XML.

| Suite | Passed | Failed | Evidence |
|---|---:|---:|---|
| Domain rules and data consistency | 30 | 0 | `test-results/unit-results.xml` |
| Real-browser workflows, concurrency, faults and layout | 37 | 0 | `test-results/browser-results.json` |
| Total | 67 | 0 | Reproducible tests are included in `tests/`. |

Environment: Node **v24.22.1**, Playwright **1.62.1**, headless Chromium **153.0.8010.0**. Browser assets were served locally; isolated contexts and an Asia/Karachi viewer timezone were used. Desktop viewport: 1365 × 900; mobile viewport: 390 × 844. A direct file launch was tested separately in this Chromium build. The application and tests require no paid service.

Covered behavior includes all original 13 review findings, source-local and UTC timestamps, reports with more than eight incidents, defined reporting periods/carry-over, CSV/JSON integrity, evidence and closure requirements, attributed history, concurrent additions with and without Web Locks, stale reviews including after reset, corrupted and unavailable storage, temporary mode, valid legacy migration, mobile overflow, print control visibility, safe text rendering, reset recovery and the six-question practice exercise.

Visual checks inspected the desktop observation desk and mobile report; report text wraps inside the panel, and the three illustrated scenarios are distinct. The print-media test confirms navigation/input/action controls are hidden and produces a diagnostic PDF. A comprehensive cross-browser print pagination audit was not performed.

The sample CSV is generated using the same schema and exact fictional seed values as the browser export; the browser suite compares the complete downloaded content to that committed file. The included sample handover is generated from seed data and is not an actual employee work product.

**Limits:** these passes establish the checked behavior, not an absence of all possible defects. No Firefox/Safari/real-device test, full accessibility audit, spreadsheet formula execution, employer-system integration, production security certification or genuine CCTV assessment was performed. The local journal is not tamper-proof. The GitHub Actions workflow is supplied; its remote execution outcome is separate from these local results.

See `docs/TEST_PLAN.md` for requirements and `docs/REVIEW_RESOLUTION.md` for the finding-by-finding mapping.
