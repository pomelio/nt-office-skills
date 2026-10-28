# Contributing

Thank you for helping. This repository is read by AI agents in real companies, so every skill is reviewed
before it is merged.

## What makes a good skill

- **One job.** A skill teaches one task an office agent does again and again. If it needs "and also", split it.
- **When to use it.** The `description` says when the skill applies, in one or two sentences. Agents choose
  skills by their description.
- **Concrete steps.** Numbered steps an agent can follow, with what to check and what good output looks like.
- **Boundaries.** Say what the agent must not do on its own (prices that aren't documented, refunds, legal
  commitments) and when it hands off to a person.
- **No secrets, no personal data, no company names** except as clearly fictional examples.
- **English**, plain words, short sentences.

## Format

```
skills/<name>/SKILL.md          required
skills/<name>/references/*.md   optional extra material the skill links to
```

`SKILL.md` starts with YAML frontmatter:

```yaml
---
name: meeting-notes-follow-up          # equals the folder name
description: When to use the skill, in one or two sentences.
license: Apache-2.0
---
```

`allowed-tools` is optional. If you use it, list only nt-office tool names (see `scripts/check-skills.mjs`)
and the connector tools described below.

### Skills that use a connected service

nt-office can connect to services such as Stripe, HubSpot, Notion, Linear or GitHub (Settings › Integrations ›
Connections); an administrator grants a connection's tools to each AI agent. A skill that needs such a service
says so:

```yaml
---
name: stripe-payment-follow-up
description: When a customer asks about a payment, find it in Stripe and answer from what it shows.
license: Apache-2.0
connectors: [stripe]                                  # providers or connection short names, at most 8
allowed-tools: [stripe.stripe_api_read, reply_ticket] # connector tools are <connector>.<tool>
---
```

- Every `<connector>.<tool>` in `allowed-tools` must name a connector listed in `connectors`.
- Name tools exactly as the service's MCP server lists them (Stripe: `stripe_api_read`, `stripe_api_search`, …).
- Installing the skill on an agent without that connector shows "Needs: stripe — not granted"; at run time the
  agent is told which connector is missing and says so instead of guessing.
- Write the steps so that reading comes first. Payments, refunds and deletions always wait for a person in
  nt-office; the skill should say that such a step needs approval.

## Limits (the same nt-office applies when it imports a skill)

| Limit | Value |
| --- | --- |
| `name` | 1–64 lowercase letters, digits and single hyphens; not starting with `builtin-` |
| `description` | 1–1,024 characters |
| `SKILL.md` body | at most 64 KiB |
| Other files | text only (`.md .csv .txt .json .yaml .yml`), at most 10, 256 KiB in total |
| Characters | no zero-width or bidirectional control characters |
| `connectors` | at most 8; each a provider or connection short name (lowercase letters, digits, hyphens) |

No scripts, executables, images or archives: nt-office never runs a skill's files.

## Pull requests

1. One skill (or one improvement) per pull request.
2. Run `node scripts/check-skills.mjs` (the CI runs it too).
3. Fill in the pull request checklist.

### Maintainers

Before merging, also run nt-office's full import checks (limits, license policy, hidden text and injection
patterns):

```sh
nt-office skills check skills
```

Every skill must report `installable` with no blocking finding. Read every `high` finding before merging.
