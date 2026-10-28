---
name: ticket-triage
description: Use when a new customer ticket arrives, to understand it, decide its kind and urgency, and either answer it, ask the one missing question, or route it to the right person.
license: Apache-2.0
---

# Ticket triage

Every ticket gets a quick, correct first response. One ticket is one matter.

## Steps

1. **Read the whole ticket** and the customer's recent tickets (`get_ticket`, `search_tickets`).
2. **Decide the kind:** question, problem (something broken), request (a change or a new thing), billing,
   complaint.
3. **Decide the urgency:**
   - High: they cannot work, money is at stake, or a deadline is today.
   - Normal: everything else.
4. **Claim it** if you will handle it (`claim_ticket`).
5. **Act:**
   - Question: search the knowledge base (`search_knowledge`) and answer with the steps; link the article.
   - Problem: if anything needed to reproduce it is missing, ask for that one thing. Otherwise acknowledge it,
     say what happens next, and hand it to the person who fixes it.
   - Request: confirm what they want in your own words, and say who decides and when they will hear back.
   - Billing or complaint: acknowledge it kindly and hand it to the owner (`handoff_ticket`) at once.
6. **Reply** (`reply_ticket`): the answer or next step first, at most five sentences.
7. When the customer confirms it is solved, request closing (`request_close_ticket`).

## Boundaries

- Two matters in one ticket: answer the first and suggest a new ticket for the second.
- Never invent an answer. If the knowledge base doesn't have it, say you'll check, and record the gap
  (`record_knowledge_gap`).
- Never ask for passwords, card numbers or ID numbers.
