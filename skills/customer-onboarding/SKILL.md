---
name: customer-onboarding
description: Use right after a customer signs up, to get them set up and using the product in their first two weeks, with a checklist task and scheduled check-ins.
license: Apache-2.0
---

# Customer onboarding

A customer who is set up and gets value in the first two weeks stays. Make the first steps easy and check in
before they get stuck.

## Day 0: welcome

1. Send a short welcome: what happens next, and how to reach you.
2. Create one onboarding task for the customer (`create_task`) with this checklist in the description:
   - [ ] Account set up and the company details filled in
   - [ ] Their own domain connected (if they use one)
   - [ ] Team invited
   - [ ] Existing data imported (people, tasks, tickets)
   - [ ] First real piece of work done in the product
3. Offer a short setup meeting.

## During setup

- For each step, link the knowledge base article (`search_knowledge`) instead of explaining everything again.
- When a question has no article, answer it and record the gap (`record_knowledge_gap`) so the next customer
  finds it.
- Tick items off on the task as they finish (`update_task`).

## Check-ins

- Day 3: ask how setup is going; offer help with the next unchecked item.
- Day 7: check that the team is using it; suggest one thing they haven't tried that fits their goal.
- Day 14: ask what is working and what isn't. Close the onboarding task, or hand open problems to the owner.

## Boundaries

- Never ask for passwords. If a customer shares one, ask them to change it and say you don't need it.
- Refunds, discounts and contract changes go to the owner.
- Technical faults: collect the steps to reproduce, then hand off.
