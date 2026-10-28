#!/usr/bin/env node
// Checks every skill under skills/ against the limits nt-office applies
// when it imports a library skill (office_domain::agent_skill and
// skill_import). No dependencies. nt-office re-checks everything on every
// sync; maintainers also run `nt-office skills check skills` before a
// release (the full checks, including the license policy).
//
//   node scripts/check-skills.mjs [skills-dir]

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.argv[2] ?? "skills";
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_BODY = 64 * 1024;
const MAX_REFERENCES = 10;
const MAX_REFERENCE_BYTES = 256 * 1024;
const REFERENCE_EXTENSIONS = new Set([".md", ".csv", ".txt", ".json", ".yaml", ".yml"]);
// Zero-width, bidirectional and other invisible characters.
const HIDDEN = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/;
// nt-office MCP tools an `allowed-tools` list may name (office-core
// mcp::FEATURE_TOOLS). Anything else is unavailable to nt-office agents.
const KNOWN_TOOLS = new Set(
  (
    "bulk_update_tasks claim_ticket create_task create_ticket_for_customer delegate_task edit_message get_agent_skill " +
    "get_article get_message get_person get_task get_ticket handoff_ticket list_agent_skills list_inbox list_my_tasks " +
    "list_tags list_tickets list_workspaces lookup_people lookup_tasks mark_conversation_read mark_inbox post_message " +
    "propose_article_draft react_to_message read_conversation record_knowledge_gap release_ticket reply_ticket " +
    "request_article_publish request_close_ticket search_knowledge search_people search_skill_library search_tasks " +
    "search_tickets send_direct_message set_task_tags snooze_inbox suggest_capability suggest_skills update_task update_ticket"
  ).split(" "),
);

// Connections (nt-office AW-C): a skill may name the connectors it needs
// (a provider such as `stripe`, or a connection's short name) and allow
// their tools as `<connector>.<tool>` (office_domain::agent_skill
// normalize_connectors / is_connector_tool).
const MAX_CONNECTORS = 8;
const CONNECTOR = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONNECTOR_TOOL = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.([A-Za-z0-9_-]{1,64})$/;

/** A bounded frontmatter reader: `key: value`, quoted values, `|` / `>` blocks, `- item` lists. */
function frontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end < 0) return null;
  const lines = text.slice(4, end).split("\n");
  const fields = {};
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    const [, key, raw] = match;
    if (raw === "|" || raw === ">" || raw === "") {
      const block = [];
      while (i + 1 < lines.length && /^(\s+|$)/.test(lines[i + 1]) && !/^[A-Za-z][\w-]*:/.test(lines[i + 1])) block.push(lines[(i += 1)].trim());
      fields[key] = block[0]?.startsWith("- ") ? block.map((item) => item.replace(/^- /, "")) : block.join(raw === "|" ? "\n" : " ").trim();
    } else {
      fields[key] = raw.replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return { fields, body: text.slice(end + 4).replace(/^\n/, "") };
}

function filesOf(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...filesOf(path));
    else out.push(path);
  }
  return out;
}

const problems = [];
const problem = (skill, message) => problems.push(`${skill}: ${message}`);
const skills = readdirSync(ROOT).filter((name) => !name.startsWith(".") && statSync(join(ROOT, name)).isDirectory());
if (skills.length === 0) problems.push(`${ROOT}: no skill folders`);
for (const skill of skills) {
  const dir = join(ROOT, skill);
  const md = join(dir, "SKILL.md");
  if (!existsSync(md)) {
    problem(skill, "SKILL.md is missing");
    continue;
  }
  const text = readFileSync(md, "utf8");
  const parsed = frontmatter(text);
  if (!parsed) {
    problem(skill, "SKILL.md must start with YAML frontmatter between --- lines");
    continue;
  }
  const { fields, body } = parsed;
  const name = fields.name ?? "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > MAX_NAME) problem(skill, `name "${name}": 1–${MAX_NAME} lowercase letters, digits and single hyphens`);
  if (name !== skill) problem(skill, `name "${name}" must equal the folder name`);
  if (name.startsWith("builtin-")) problem(skill, "names starting with builtin- are reserved");
  const description = fields.description ?? "";
  if (description.length < 1 || description.length > MAX_DESCRIPTION) problem(skill, `description: 1–${MAX_DESCRIPTION} characters (has ${description.length})`);
  if (fields.license !== "Apache-2.0") problem(skill, 'license: must be "Apache-2.0" (the repository license)');
  if (Buffer.byteLength(body) > MAX_BODY) problem(skill, `body is over ${MAX_BODY / 1024} KiB`);
  if (body.trim().length === 0) problem(skill, "the body is empty");
  const asList = (value) =>
    Array.isArray(value) ? value : String(value).replace(/^\[|\]$/g, "").split(/[\s,]+/).filter(Boolean);
  const connectors = fields.connectors === undefined ? [] : asList(fields.connectors);
  if (connectors.length > MAX_CONNECTORS) problem(skill, `connectors: at most ${MAX_CONNECTORS}`);
  for (const connector of connectors) {
    if (!CONNECTOR.test(connector) || connector.length > 32) problem(skill, `connectors: "${connector}" is not a connector name (a provider such as stripe, or a connection's short name)`);
  }
  const tools = fields["allowed-tools"];
  if (tools !== undefined) {
    for (const tool of asList(tools)) {
      const connectorTool = CONNECTOR_TOOL.exec(tool);
      if (connectorTool) {
        if (tool.length > 64) problem(skill, `allowed-tools: "${tool}" is longer than 64 characters`);
        if (!connectors.includes(connectorTool[1])) problem(skill, `allowed-tools: "${tool}" names connector "${connectorTool[1]}"; list it under connectors`);
      } else if (!KNOWN_TOOLS.has(tool)) {
        problem(skill, `allowed-tools: "${tool}" is not an nt-office tool or a <connector>.<tool> name`);
      }
    }
  }
  let count = 0;
  let bytes = 0;
  for (const file of filesOf(dir)) {
    const path = relative(dir, file);
    const content = readFileSync(file);
    if (HIDDEN.test(content.toString("utf8"))) problem(skill, `${path}: contains zero-width or bidirectional characters`);
    if (path === "SKILL.md") continue;
    if (!REFERENCE_EXTENSIONS.has(extname(path).toLowerCase())) {
      problem(skill, `${path}: only text files (${[...REFERENCE_EXTENSIONS].join(" ")}) are allowed; no scripts or binaries`);
      continue;
    }
    count += 1;
    bytes += content.length;
  }
  if (count > MAX_REFERENCES) problem(skill, `${count} reference files (at most ${MAX_REFERENCES})`);
  if (bytes > MAX_REFERENCE_BYTES) problem(skill, `reference files total ${bytes} bytes (at most ${MAX_REFERENCE_BYTES})`);
}

if (problems.length > 0) {
  console.error(problems.map((line) => `✗ ${line}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${skills.length} skills pass`);
