---
name: send-stripe-invoice
description: Use on a customer ticket when an invoice must be created in Stripe and emailed to the customer — the customer asked for one, or the ticket's plan or your instructions include invoicing. Reads first, prepares the invoice, and sends it only after a person approves each step.
license: Apache-2.0
connectors: [stripe]
---

# Send a Stripe invoice

A customer should get a correct invoice by email, from Stripe, with a page to pay it. You prepare the invoice
from what was agreed on the ticket; a person approves every Stripe write; Stripe sends the email.
Every customer invoice belongs to a ticket, so the customer and the team can see what was sent and why.

## When to use it

- The customer asks on a ticket: "Can you send me an invoice for …?"
- The ticket's plan, or your instructions on it, include "invoice the customer".
- A person asks you to invoice someone by email who may not be a customer yet (see "No customer yet").

Don't use it for refunds, credit notes, discounts nobody agreed, editing a finalized invoice, voiding, or overdue
invoices (use `invoice-chasing`). If the customer disputes an amount, hand the ticket to its owner.

## What you need before writing anything

| Field | Required | Where it comes from |
| --- | --- | --- |
| Customer email | yes | the ticket's requester (`get_ticket`, then `get_person`) |
| Customer name | yes for a new customer | the ticket or the request; company name optional |
| Line items: description, quantity, unit price | yes, at least one | the ticket conversation or the request; a price only if it is stated there or in the knowledge base price list |
| Currency | yes | stated on the ticket, else the price list's currency; never assumed |
| Payment terms: due in N days, or a due date | yes | the ticket or the request |
| Memo, customer reference (PO number) | optional | the ticket or the request |

Tax: keep the account's configured tax behavior. Add no tax lines or rates yourself, and never enable or
disable automatic tax to make a request pass. If Stripe requires tax details that are missing, hand off.

If anything required is missing or unclear, ask once, listing everything that is missing: on the ticket
(`reply_ticket`) or to the person who asked you. Never guess a price, a quantity, a currency or a due date.

## Steps

1. **No customer yet.** If a person asked you to invoice an email address that has no ticket:
   - Find them: `lookup_people` or `search_people` with the email.
   - Nobody found: ask for them to become a customer with `request_invite_customer` (email, name, company,
     reason: "Invoice for …"). An administrator decides; wait until it is approved. If it is declined, tell
     the person who asked and stop.
   - After `pending_action_resolved` confirms approval, look up the person again. Continue only when they
     are an active customer (guest). If the email belongs to a staff member or is ambiguous, hand off.
   - Open a ticket for the invoice: `create_ticket_for_customer` with `origin: on_behalf`, subject
     "Invoice: <what>", and a body that restates what will be invoiced. Work on that ticket from here.
     Use `on_behalf` only when this records the customer's request; a team-initiated request uses
     `origin: outbound` and its contact rules. Check for an existing invoice ticket before opening one.

2. **Read the ticket.** `get_ticket`, then `read_conversation` for the agreed items, quantities, prices,
   currency and terms. Check the price list with `search_knowledge` and `get_article` when the ticket names
   a product but not its price.

3. **Get the email.** `get_person` with the ticket's `requester.user_id`. If `email_placeholder` is true or
   `contactable` is false, the customer can't receive email: hand the ticket off (`handoff_ticket`) and say why.

4. **Find the customer in Stripe (read).** Search customers by email (`stripe_api_search`, for example
   `email:'ana@example.com'`).
   - One match: use it.
   - More than one: hand off; a person decides which account is right.
   - None: you will create one in step 5a.

   Also read the customer's recent invoices and any invoice already linked to the ticket. Compare ticket
   metadata, items, quantities, currency and terms, including draft, open and paid invoices. Search can lag
   behind a write: after a timeout or an approval, read the known invoice id or list this customer's
   invoices before retrying. An existing paid or sent invoice is not a new invoice request. For a matching
   draft, ask whether to resume it; never add the same lines twice or resend without new instructions.

5. **Prepare and send (writes).** Each call to `stripe_api_write` waits for a person's approval before it
   runs, whatever your autonomy. A pending approval is not a completed write: wait for its resolution and
   read the result before continuing. Reuse an operation's idempotency key if the connector supports it;
   don't submit a replacement while its outcome is unknown. Keep arguments self-explanatory. Before each one,
   say in one line what it does and the invoice total, for example: "Create the invoice for Acme Ltd:
   USD 1,500.00, due in 14 days."
   - a. Only if step 4 found none: **create the customer** (`POST /v1/customers`): email, name, and metadata
     `nt_office_user` = the requester's user id.
   - b. **Create the invoice** (`POST /v1/invoices`): customer, `collection_method=send_invoice`,
     `days_until_due` (or `due_date`), currency, `auto_advance=false`, description (what it is for and the
     ticket), metadata `nt_office_ticket` = the ticket id, and the customer reference if given. Set
     `pending_invoice_items_behavior=exclude` so unrelated pending items do not enter this invoice.
     Use one of `days_until_due` and `due_date`, not both; clarify the time zone for an exact due date.
   - c. **Add all lines in one call** (`POST /v1/invoices/{id}/add_lines`): for each line a description,
     quantity and unit price in the currency's minor units (USD 150.00 is 15000). Follow the connector's
     API version: a unit price belongs in its supported pricing fields, such as `price_data.unit_amount`,
     not an invented top-level `unit_amount`. Include required product data, or use an existing Price only
     after checking that its unit price and currency match the agreement. If permissions or required
     pricing data are missing, hand off instead of changing the invoice or creating extra writes.
   - d. **Read back, then send.** Check the invoice's customer email, all lines, subtotal, taxes, total,
     currency and terms against the agreement. A mismatch needs a person; do not send it. Then request
     `POST /v1/invoices/{id}/send`. Check the response and resulting status; if Stripe requires an explicit
     finalization, that is a separate approved write (`POST /v1/invoices/{id}/finalize`,
     `auto_advance=false`) before sending. Never turn on automatic sending to avoid an approval.

   If a person declines a step or its approval expires, stop. Write on the ticket what happened, and don't
   try again without new instructions. A draft left from steps b–c can stay; tell the owner it exists.

6. **Tell the customer.** Read the sent invoice (`stripe_api_read`): number, total, due date and the hosted
   invoice link. Reply on the ticket (`reply_ticket`), in the customer's language and in three to five
   sentences: the invoice number, the amount and currency, the due date, that Stripe emailed it to their
   address, and the link to pay. A successful send does not prove delivery or payment; don't say the
   customer received it or has paid. In test mode say it was simulated: Stripe's API sends no email there.
   When nothing else is open, request closing (`request_close_ticket`).

## Boundaries

- Amounts always in minor units with an explicit currency; check the total against what was agreed before
  every write.
- No prices that aren't on the ticket or in the price list, no discounts, no free items, no changes to
  payment terms on your own.
- Never refund, void, delete or edit a sent invoice; hand that to the owner.
- Never ask for or write card or bank details; the customer pays on Stripe's page.
- Try a new setup in Stripe test mode first. If the ticket is marked as a test and the connection is live,
  stop and ask. Confirm the mode from the connected account or a read result before the first write;
  if you cannot establish it, stop. Do not put API keys in the ticket or skill.

## Example

A fictional customer writes on ticket #1042: "Please invoice us for 25 seats on the annual plan, due in 14 days."
The price list says the annual plan is USD 120 per seat per year.

1. Ask nothing: items, price, currency and terms are all known.
2. Stripe has no customer with that email. Four approvals follow: create the customer; create the invoice
   (USD, send_invoice, due in 14 days, metadata nt_office_ticket); add one line, "Annual plan, 25 seats",
   quantity 25 at 12000; read back the USD 3,000.00 subtotal and agreed total, then send it.
   This assumes no tax or balance adjustment, supported pricing and no separate finalization call;
   finalization, if required, needs one more approval.
3. Reply: "We've sent invoice INV-0042 for USD 3,000.00 to ana@example.com from Stripe. It's due on
   21 November. You can pay on the invoice page: <link>. Let me know if anything on it needs to change."
   In a test run, report "Test invoice INV-0042 was created; Stripe simulated sending and did not email it."

## Stripe references

- [Sending invoices, including test-mode behavior](https://docs.stripe.com/api/invoices/send)
- [Creating a draft invoice](https://docs.stripe.com/api/invoices/create)
- [Bulk line parameters in Stripe's official SDK](https://github.com/stripe/stripe-python/blob/master/stripe/params/_invoice_add_lines_params.py)
