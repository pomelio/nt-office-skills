---
name: send-stripe-invoice
description: Use on a customer ticket when an invoice must be created in Stripe and emailed to the customer — the customer asked for one, or the ticket's plan or your instructions include invoicing. Reads first, prepares the invoice, and sends it only after a person approves each step.
license: Apache-2.0
connectors: [stripe, google]
---

# Send a Stripe invoice

A customer should get a correct Stripe invoice and a Gmail email with its payment link. You prepare the
invoice from what was agreed on the ticket; a person approves every Stripe write. Send the email through
the employee’s granted Google Gmail connection, using its normal send approval and cooling rules.
The company system-email setting does not grant this employee a Gmail tool.
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

## Planning and prerequisites

In Plan mode, read the relevant skills and propose the work; never create a guest, invoice, or email.
The customer may be new. Plan one complete execution step for an Account manager where possible, with
all customer details, invoice facts, origin and Gmail delivery instructions. After Apply, use the
`create-guest` skill for the new-customer approval and ticket prerequisite. If that skill is not installed,
follow step 1 below. Do not claim the customer must already exist before planning.

Before the first Stripe write, confirm that a granted Google connection exposes `gmail_send_message`
and that it is enabled. If missing or paused, tell the requesting person the reason and ask them to
contact an administrator to configure or grant the mail connection. Do not create an invoice you cannot
send, fall back to SMTP, or send through Stripe instead. Tools can be named with the connection's short
name at runtime; use the actual granted tool, not an invented prefix.

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
   - d. **Read back, then finalize.** Check the invoice's customer email, every line, subtotal,
     taxes, total, currency and terms. A mismatch needs a person; do not send. Request the approved write
     `POST /v1/invoices/{id}/finalize` with `auto_advance=false`. Read back the finalized invoice and its
     `hosted_invoice_url`. Never call the Stripe `/send` endpoint or enable automatic sending: Gmail
     handles delivery. If finalization fails or the URL is missing, stop and report the reason.

   If a person declines a step or its approval expires, stop. Write on the ticket what happened, and don't
   try again without new instructions. A draft left from steps b–c can stay; tell the owner it exists.

6. **Email through Gmail.** Read the finalized invoice: number, total, currency, due date and
   hosted invoice link. Recheck the ticket's requester email and contact preference. Prepare a plain-text
   email with the invoice number in the subject and the amount, currency, due date and exact returned
   hosted link in its body. Use the granted `gmail_send_message` tool with `to` containing only the
   requester email, `subject` and `body`; do not add CC recipients. The payment page also offers a PDF;
   do not invent an attachment parameter. Respect the tool's approval and cooling result and wait for
   completion before claiming it was sent.

   Before sending or retrying, inspect this work's previous tool results and the connected Gmail sent
   messages (the granted `gmail_list_messages` and `gmail_read_message` tools) for the same recipient,
   invoice number and link. After an uncertain send, read first; if the outcome cannot be established,
   hand off instead of sending again. If the tool fails, report its safe error reason and ask the person
   to contact an administrator to check the mail connection. Keep the same finalized invoice; do not
   create another one or fall back to Stripe mail. Only record a send as successful after the Gmail
   result confirms it; a draft, held send or pending approval is not a sent email.

7. **Record the outcome on the ticket.** After Gmail confirms sending, use `reply_ticket` to report
   the invoice number, amount, currency, due date and payment link, and that the email was sent through
   Gmail. A send is not proof of delivery or payment. Keep internal approval details and raw provider
   errors out of customer-visible replies. If Gmail failed, tell the requesting person the reason and
   keep the ticket open. Request closing only when all requested work is complete.

   In Stripe test mode, label both the Gmail subject and body as a test with no real payment expected.
   Gmail is still a real send even when Stripe is in test mode: send only to the explicitly approved
   test recipient, never to an actual customer by assuming that test mode suppresses email.

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
2. Stripe has no customer with that email. Approved writes create the customer, the draft invoice,
   its line for 25 seats at USD 120, and finalize it with automatic advancement disabled. Read back the
   agreed total of USD 3,000.00, assuming no tax or balance adjustment, and its payment link.
3. Use Gmail to send the invoice number, total, due date and returned payment link to the requester.
   Wait for the send result, then record the outcome on ticket #1042. Do not also send through Stripe.
   In a test run use only the approved test recipient and clearly label the email as a test.

## Stripe references

- [Finalizing an invoice](https://docs.stripe.com/api/invoices/finalize)
- [Hosted invoice page and sharing its link](https://docs.stripe.com/invoicing/hosted-invoice-page)
- [Creating a draft invoice](https://docs.stripe.com/api/invoices/create)
- [Bulk line parameters in Stripe's official SDK](https://github.com/stripe/stripe-python/blob/master/stripe/params/_invoice_add_lines_params.py)
