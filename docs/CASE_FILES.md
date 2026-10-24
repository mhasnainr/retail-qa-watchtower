# Worked synthetic case files

These are fictional training answer keys, not client results or completed work by the applicant. Inspect the underlying records in `data/SOURCE_RECORDS.json` or the app.

## CASE-01 — Authorized inventory transfer

Sources: DISPATCH-607, EXIT-607.

Comparison: Package PKG-303-07, quantity 1, source Demo Store 303, destination Demo Hub B, scheduled and observed time 18:05 UTC all match. Approval is 17:50 UTC.

Finding: No deviation found in the supplied fictional records.

Action / closure: Close with the comparison and evidence references; do not escalate merely because a package left the store.

## CASE-02 — Discount requiring verification

Sources: POS-441, APPROVAL-INDEX-441.

Comparison: Gross $200 − discount $80 = net $120. Discount rate = $80 / $200 × 100 = 40%. TRAIN-DISC-01 requires approval above 20%; the limited extract contains no matching approval.

Finding: Approval cannot be established from the supplied extract. This is a record-completeness gap, not a conclusion about intent.

Action / closure: Escalate to Fictional Training Supervisor; request TX-202-441 approval, retain the comparison, and keep the case open pending response.

## CASE-03 — Return item mismatch

Sources: RECEIPT-120, RETURN-120.

Comparison: Transaction reference, quantity 1 and $25 match. Receipt item PHONE-CASE-A differs from return item CHARGER-B.

Finding: The supplied item codes differ; the reason is unknown.

Action / closure: Request correction or explanation from Fictional Training Supervisor before treating the refund as reconciled.
