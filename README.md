# nt-office skills

Skills for AI employees in [nt-office](https://github.com/pomelio/nt-office): the office for a one-person
company, where AI agents do the work and people review and guide it.

Each skill is a folder with a `SKILL.md` (the [Agent Skills](https://agentskills.io) format) that teaches an
agent one job: how to run a sales discovery call, triage a ticket, chase an invoice. The same folders work in
nt-office, Claude Code and other tools that read Agent Skills.

## Skills

| Skill | What it does |
| --- | --- |
| [agenda-led-meeting](skills/agenda-led-meeting/SKILL.md) | Leads a meeting along its agenda and keeps the live heading current |
| [customer-onboarding](skills/customer-onboarding/SKILL.md) | Gets a new customer set up, with a checklist task and follow-ups |
| [invoice-chasing](skills/invoice-chasing/SKILL.md) | Sends polite payment reminders on a schedule and escalates to the owner |
| [knowledge-article-writing](skills/knowledge-article-writing/SKILL.md) | Turns a repeated answer or a knowledge gap into an article draft |
| [meeting-notes-follow-up](skills/meeting-notes-follow-up/SKILL.md) | Writes the summary, decisions and tasks after a meeting |
| [sales-discovery-call](skills/sales-discovery-call/SKILL.md) | Qualifies a lead, records their needs and agrees the next step |
| [ticket-triage](skills/ticket-triage/SKILL.md) | Classifies, claims and answers or routes a customer ticket |
| [weekly-status-report](skills/weekly-status-report/SKILL.md) | Summarises the week's tasks and tickets for the owner |

## Use them

**In nt-office:** this repository is a built-in skill source. An administrator sees it under
Settings › AI agents › Skill sources; nt-office syncs it and checks every skill. To give a skill to an agent,
open Browse library and choose Install on agent. The agent's owner reviews it there.

**In Claude Code:** copy a folder into your skills directory, for example
`cp -r skills/meeting-notes-follow-up ~/.claude/skills/`.

The skills mention nt-office tools (`reply_ticket`, `create_task`, `search_knowledge`, …). Elsewhere, agents
use whatever equivalent they have.

## Contribute

New skills and improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the format, the limits and
how skills are reviewed.

## License

[Apache-2.0](LICENSE). By contributing you agree your contribution is licensed the same way.
