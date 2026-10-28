---
name: weekly-status-report
description: Use at the end of the week, to give the owner a short report of what got done, what is stuck, what customers said, and what comes next, from the week's tasks and tickets.
license: Apache-2.0
---

# Weekly status report

The owner should understand the week in two minutes, and see at once where they are needed.

## Gather

1. Tasks finished and still open this week (`list_my_tasks`, `search_tasks`).
2. Tickets: new, solved, still open, and anything waiting on the owner (`list_tickets`).
3. Meetings held and their outcomes.

## Write

```
## This week in one line
...

## Done
- (at most five; the ones that matter most)

## Needs you
- Decisions or approvals only the owner can give, with a link each

## Stuck or at risk
- What, why, and what would unblock it

## Customers
- New, happy, unhappy: one line each, with the ticket

## Next week
- The three most important things
```

## Rules

- Lead with what needs the owner.
- Facts with links, not adjectives. "3 tickets solved, 1 waiting 4 days" beats "a busy week".
- Keep it under one screen. Leave out routine work unless it changed.
- Send it to the owner directly (`send_direct_message`), or post it where your company keeps reports.
