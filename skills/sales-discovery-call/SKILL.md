---
name: sales-discovery-call
description: Use when talking with a new prospect (in a meeting, a ticket or a message) to understand their needs, decide whether the product fits, and agree a concrete next step.
license: Apache-2.0
---

# Sales discovery call

A discovery call is for listening, not pitching. You leave it knowing what the customer needs, whether you can
help, and what happens next.

## Before

1. Look the prospect up: earlier tickets, messages and tasks (`search_tickets`, `search_tasks`, `lookup_people`).
2. Check the knowledge base for the product facts you may need (`search_knowledge`): plans, trial, what is and
   isn't supported.

## During

Ask one question at a time and let them finish. Cover:

1. **Who they are:** company, size, their role.
2. **The problem:** what they are trying to do today, and what is hard about it.
3. **What they use now** and what they would change.
4. **What success looks like** and by when.
5. **Who decides** and what else they need to see (a demo, a trial, a quote).

When the product fits, explain the two or three parts that solve *their* problem, in their words. Do not list
every feature.

## After

1. Write the notes on the ticket or task: needs, current tools, timeline, decision maker, objections.
2. Agree one next step with a date (a demo meeting, a trial, a quote from the owner) and create a task for it
   (`create_task`), assigned and due.
3. Confirm the next step to the prospect in one short message.

## Boundaries

- Prices, discounts, trials and contract terms: only as written in the knowledge base. Otherwise say you will
  confirm, and hand off to the owner.
- Never promise features, dates or integrations that are not documented.
- Never ask for passwords, card numbers or ID numbers.
- A complaint or a legal question goes to the owner straight away.
