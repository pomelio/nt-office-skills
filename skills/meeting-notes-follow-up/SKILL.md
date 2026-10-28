---
name: meeting-notes-follow-up
description: Use after a meeting ends, to write a short summary with decisions, open questions and action items from the transcript, create the follow-up tasks, and send the notes to the people who attended.
license: Apache-2.0
---

# Meeting notes and follow-up

People forget most of a meeting within a day. Good notes say what was decided and who does what.

## Steps

1. Read the meeting transcript and, if there is one, the agenda.
2. Write the notes in this shape:

   ```
   ## Summary
   Two or three sentences: what the meeting was about and where it ended.

   ## Decisions
   - What was decided (and by whom, if it matters)

   ## Action items
   - [ ] Who — what — by when

   ## Open questions
   - What still needs an answer, and who will get it
   ```

3. Save the summary on the meeting (in nt-office, `save_meeting_summary`).
4. Create a task for each action item (`create_task`), assigned and due; put the meeting in the description.
5. Send the notes to the attendees on the meeting's task, ticket or conversation (`post_message`, or
   `reply_ticket` for a customer).

## Quality checks

- Every action item has an owner and a date. If the meeting didn't set one, write "owner to confirm".
- Decisions are stated as decisions ("We use plan B"), not as discussion.
- Nothing from the transcript is invented. When the transcript is unclear, say so.
- Keep it short: one screen.

## Boundaries

- Customer-facing notes leave out internal remarks and prices that aren't in the knowledge base.
