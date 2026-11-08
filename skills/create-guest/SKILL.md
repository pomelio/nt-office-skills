---
name: create-guest
description: Use when work needs a new customer guest, including opening a ticket for an email address not yet in nt-office. Check for an existing person first, request administrator approval, then resume the requested work after approval.
license: Apache-2.0
---

# Create a customer guest

Make an approved customer account available for the work the person requested. A guest is a customer,
not a member or an AI employee. This skill requires an AI employee with the Account manager role.
Installing a skill changes neither role requirements nor approval rules.

## Planning

In Plan mode, read this skill and propose the steps without executing them. A customer need not exist
before the person plans a ticket. Ask for the customer's email and name, and a company only if relevant.
Include the requested ticket subject, purpose, origin and follow-on work in the execution instructions.
Apply delegates the work; it does not itself approve a new customer or send anything.

Keep guest creation and its dependent ticket work in one execution step where possible, so the same
employee retains context while waiting for approval. Do not mark the step done while approval is pending.

## Steps after Apply

1. Read the request. Require a real email, a name, and a reason for creating the customer. Ask once for
   missing information. Never invent a name from an email, use a placeholder address, or copy unrelated
   private information. Confirm whether this records the customer's own request or proactive outreach.
2. Look up the exact email with `lookup_people` or `search_people`, then check the result with `get_person`.
   Reuse an existing active guest. If it belongs to a member, an AI employee, a suspended account, or more
   than one result is plausible, stop and ask a person; never change an account's kind or status.
3. If absent, call `request_invite_customer` with email, name, optional company, the business reason and a stable `client_request_id`.
   This always requires administrator approval and sends an invitation when approved. A pending request
   is not a created account. Keep the approval reference in your work record and wait for
   `pending_action_resolved`; do not submit another request while one is pending. The service limits an
   employee to five new-customer requests a day and blocks addresses declined in the last 30 days.
4. If declined, expired or unsuccessful, report the outcome to the person who requested the work and
   stop. Do not open a ticket, invoice or email the address, and do not retry through another tool.
5. When approval succeeds, look up the email again and verify an active guest with the intended email.
   Use its actual user id for the next operation. Approval alone is not proof that account creation
   completed; report any failure and keep the dependent work waiting.
6. If asked to open a ticket, search for the same customer's existing ticket for this work before
   `create_ticket_for_customer`. Use `origin: on_behalf` only for the customer's own request; a staff
   request to contact them uses `origin: outbound` and obeys their contact preference. Include the
   agreed scope in the body and reuse the same `client_request_id` if retrying an uncertain creation.
   Confirm the ticket with `get_ticket` and continue the requested skill on that ticket. Do not put
   staff-only execution instructions or secrets in its customer-visible body.

## Result

Tell the requesting person whether the guest was reused, is waiting for approval, or is ready; include
the ticket reference once it exists. Never report an invitation as delivered just because it was sent.
For an invoice request, continue with `send-stripe-invoice`; this skill does not create charges, send
invoice emails, or approve those actions.
