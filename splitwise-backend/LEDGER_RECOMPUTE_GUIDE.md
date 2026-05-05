# Ledger Recompute Guide (Legacy Data Hygiene)

Use this when historical data was created while cross-scope netting logic was inconsistent.

## When to run

- Pair-level balances look correct in one surface but stale/contradictory in another.
- Users see residual group rows after legacy overall settlements.
- New code fixes are deployed but old rows still appear inconsistent.

## Recommended strategy

1. Take a DB backup.
2. Rebuild ledger rows from canonical sources:
   - Expenses (`paidBy`, `splitDetails`, `groupId`)
   - Settlements (`fromUser`, `toUser`, `amount`, `groupId`/overall allocation)
3. Recompute per `(fromUser, toUser, groupId)` scope in deterministic order.
4. Replace existing ledger collection contents atomically (or in maintenance mode).
5. Validate with a few known user-pairs and groups before reopening traffic.

## Validation checklist

- Global pair-net matches manual transaction arithmetic.
- Group balances reflect only group-scoped rows.
- Overall settlement no longer causes contradictory actionable rows.
- Settlement API no longer returns false `No outstanding debt` for valid debtor direction.

## Notes

- This guide is forward-compatible with the current pair-net UX policy.
- Do not run this during active writes unless you gate expense/settlement APIs.
