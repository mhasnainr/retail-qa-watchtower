# Test plan — Retail QA Watchtower v2

## Objective and test basis

Verify that a user can record a fictional observation, inspect supporting records, review or escalate it with attribution, and export a complete scoped handover without silent data loss. Test basis: README workflows, the 13 findings from the 24 October 2026 review, and the requirements below. This is a training application, not a production CCTV platform.

## Requirements and risk coverage

| Requirement | Acceptance criterion | Automated evidence |
|---|---|---|
| REQ-01 Observation integrity | Explicit source, event instant, timezone, creation time and recorder; no blank facts | B03–B07, domain timestamp/validation tests |
| REQ-02 Complete handover | All in-day events plus older unresolved events; no eight-record cap; scope declared | B08–B10, report count and boundary tests |
| REQ-03 Evidence qualification | Known same-store references, reviewer and finding required for qualified evidence | B15–B18, reference and closure tests |
| REQ-04 Defensible closure | Outcome, reviewer, resolution time, history and retained original facts | B16–B18, reopen/correction tests |
| REQ-05 Task reconciliation | Comparison and reviewer; recipient required for escalation | B19, task domain tests |
| REQ-06 Multi-tab integrity | Independent additions preserved; stale edits rejected or visibly conflicted | B20–B22, replay/conflict tests |
| REQ-07 Storage resilience | Invalid raw data preserved; no false success on write failure; explicit temporary mode | B23–B26 |
| REQ-08 Export integrity | Matching sample schema, correct quoting, formula-leading text neutralized, lossless JSON | B11–B14, CSV domain tests |
| REQ-09 Usable output | No page-wide mobile overflow; print excludes controls | B27–B28 |
| REQ-10 Safe text rendering | Untrusted markup stays text in register, report and history | B29 |
| REQ-11 Reset recovery | Cancel preserves state; reset restores active seed and retains journal | B30, reset-generation tests |
| REQ-12 Honest training content | Source records inspectable; illustrated sequences/answer keys labeled; quiz calculations correct | B01–B03, B31–B33, arithmetic/source consistency tests |

## Approach

- Domain tests use Node's built-in runner and validate behavior at time boundaries, DST transitions, evidence and closure rules, replay conflicts, CSV injection probes and seed arithmetic.
- Browser tests use Playwright with fresh contexts, the real local static assets and browser events. The concurrency tests include parallel tab submissions and a browser without Web Locks.
- Fault injection deliberately blocks or corrupts local storage. These probes test recovery behavior; they are not claims of remotely exploitable attacks.
- User-entered markup and `=1+1` are harmless test probes. Spreadsheet formula execution is not performed.
- Responsive checks compare document and viewport widths at 390 px for every section. Print controls are checked in print media. Diagnostic screenshots/print output are internal, not delivered as proof of a certified layout.

## Entry and exit criteria

Entry: fixture generator succeeds; every seeded record satisfies validation; app starts without script errors. Exit: both suites complete without failing tests; all 13 review findings map to implemented behavior or an explicitly corrected scope statement; package contains source, fixtures, docs and execution records; ZIP can be extracted and launched. Failures must be investigated and rerun after correction. No planned retest is labeled executed.

## Manual exploration and limits

Inspect desktop and 390-pixel mobile views, the evidence comparison workflow and print output. Verify wording distinguishes record gaps from wrongdoing. Validate the entire archive inventory and compare sample CSV schema to the real download.

Out of scope: real CCTV performance, employer systems/SOPs, real personal data, production privacy/security certification, Excel/LibreOffice execution, real mobile devices, Firefox/Safari, comprehensive screen-reader/keyboard accessibility and API/SQL testing. No paid external services are used.

Actual results, execution date and versions are stored separately in `docs/VALIDATION.md` and `test-results/`.
