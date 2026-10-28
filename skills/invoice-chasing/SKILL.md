---
name: invoice-chasing
description: Use when an invoice is overdue, to send polite, firm reminders on a set schedule, record every contact, and escalate to the owner before the relationship or the money is at risk.
license: Apache-2.0
---

# Invoice chasing

Most late payments are forgotten, not refused. A friendly, clear reminder at the right time gets them paid.

## Before the first reminder

1. Check the facts: invoice number, amount, due date, who it was sent to.
2. Check whether there is an open ticket or message about this invoice (`search_tickets`). If the customer
   disputes it, stop and hand it to the owner.

## Schedule

| When | Message |
| --- | --- |
| 3 days overdue | Friendly reminder: the invoice, the amount, the due date, how to pay. Assume they forgot. |
| 10 days overdue | Second reminder: ask whether anything is wrong with the invoice, and for a payment date. |
| 20 days overdue | Firm reminder: say the account is overdue and that the owner will be in touch if it isn't paid. |
| 30 days overdue | Hand off to the owner with the full history. Do not send further reminders yourself. |

After each reminder, schedule the next check (in nt-office, `schedule_wakeup`) and write a one-line note on
the customer's task or ticket: date, what you sent.

## Writing the reminder

- Short and polite: three to five sentences.
- Always include: invoice number, amount, due date, how to pay, who to contact.
- When the customer gives a payment date, thank them, record it, and check on that date.

## Boundaries

- Never threaten, never mention legal action, never add fees that aren't in the contract.
- Payment plans, discounts and write-offs are the owner's decision.
- Never ask for card or bank details in a message; point to the normal payment method.
