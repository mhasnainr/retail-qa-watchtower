# Review findings and implemented resolutions

This matrix tracks the original 24 October 2026 review. It describes implemented behavior. Actual pass/fail execution is recorded in `test-results/` and `VALIDATION.md`.

| Finding | Implemented resolution | Verification |
|---|---|---|
| R01 Missing incident times | Source-local date/time and IANA timezone, exact UTC event time, separate creation time/actor in every handover case | B06, B08; time domain tests |
| R02 Silent last-eight cutoff | No slice limit; every included event appears, High priority first; included and excluded counts declared | B09; >8 domain test |
| R03 Undefined daily period | Saved date/timezone, exclusive next-midnight boundary, explicit in-day/carry-over/excluded counts and queue snapshot label | B10; period and DST tests |
| R04 Formula-like CSV input | Formula-leading strings receive a text prefix; correct CSV quoting; raw values retained in JSON; spreadsheet limitations documented | B11–B13; encoding probes |
| R05 Invalid stored record crash | Full journal payload validation; invalid raw entries quarantined, visible warning and recovery export | B23–B24 |
| R06 Uncaught storage error | Visible no-save message; no state update or draft clearing; explicit temporary mode and JSON export | B25–B26 |
| R07 Silent whitespace rejection | Trim-aware field validation, invalid-field focus/marking and visible feedback | B04–B05 |
| R08 Concurrent-tab overwrite | Unique operation keys, UUID incident IDs, Web Locks where available, storage synchronization and versioned review conflict handling | B20–B22; conflict domain tests |
| R09 Report overflow | Wrapping applied directly to report `<pre>`; responsive minimum-width rules; tables scroll within their own region | B27; visual inspection |
| R10 Missing disposition/history | Required closure outcome, reviewer, finding, evidence refs and resolution instant; append-only application history; reopen/correction flow | B16–B18; history domain tests |
| R11 Unsupported corroboration | Inspectable synthetic source records; same-store references and finding required; evidence state can be reviewed later | B15–B18, B33 |
| R12 Analyst name lost | Explicit Save report settings persists analyst/date/timezone and provides feedback | B10 |
| R13 Unpolished print output | Print-only handover; navigation, metrics and controls hidden; report wrapping, light colors and page margins | B28; print inspection |

Additional gaps addressed:

- Sample incident CSV is generated from the same schema and fictional starting records as the app export.
- Three complete fictional case files and the referenced dispatch/POS/approval/receipt/return/callback data are included.
- Scenarios have distinct scenes and a step/play sequence. Observation notes start blank; optional guidance and answer keys are labeled. No claim of sustained real-world monitoring competence is made.
- Task reviews store a comparison, actor, status, history and escalation recipient.
- Metric labels distinguish all-time unresolved cases from report-period Open/Escalated counts. Escalated tasks remain separately visible.
- Store-local timezone conversion records exact UTC instants. Ambiguous/nonexistent DST times are rejected with an explanation rather than guessed.
- Legacy data has a visible preservation/migration route; unsupported old closure/evidence claims are reset for verification with original labels retained.
- README, test plan, reproducible tests and execution records provide actual software-testing artifacts. API/SQL expertise is not implied.

Remaining scope limits are intrinsic to an offline synthetic portfolio: no real footage, company SOP access, authenticated identities, server-backed tamper resistance, production evidence retention or certified independent assessment. These are explicitly described instead of represented as working features.
