#!/usr/bin/env node
// CLAUDE.md is loaded on every turn, and so is every unscoped file in
// `.claude/rules/`. This is the budget on that, and the drift check on the
// records the narrative was moved into.
//
// WHY THIS IS A GATE AND NOT A SENTENCE. Two repositories in this portfolio
// split one of these files and grew it back, and neither noticed — measured
// 2026-09-22 against each file's own recorded figure: rePLCa 2,024 -> 226 and
// 983 today, FullSim 5,789 -> 1,552 and 2,752 today. Both records are honest
// and both files are four to six times their post-split size regardless. A
// number in prose is not a constraint.
//
// ONE CEILING, AND IT IS ON WHAT IS LOADED. Capping CLAUDE.md *and* the total
// would make the first unreachable — the total is the larger number by
// construction — which is an unreachable branch wearing a load-bearing one's
// clothes. The ceiling is the sum; a `paths:`-scoped rule file is out of it,
// because it is not in context until somebody opens the files it governs.
//
// THE FLOOR IS ON CLAUDE.md ALONE, because a file cut to nothing satisfies a
// ceiling perfectly and the standing rules are what make it worth loading.
//
// THREE NUMBERS, NEVER TWO. The report prints the file, the unscoped rules and
// the exempt ones separately: a total alone cannot say whether the budget went
// on standing rules or on something that should have been scoped.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLAUDE = join(ROOT, "CLAUDE.md");
const RULES = join(ROOT, ".claude", "rules");
const RECORDS = join(ROOT, "docs", "decisions");

//: 60 lines of standing rules, and 200 of context every turn.
const MIN_CLAUDE_LINES = 60;
const MAX_LOADED_LINES = 200;

//: Exempt from the budget, with the reason. Asserted to still exist below: an
//: exemption naming a file that is gone excuses nothing and is a waiver.
const EXEMPT = new Map([
  ["house-voice.md", "portfolio-wide, installed from Pathforward's kit byte for byte, " +
                     "and exempted by the owner rather than by this repository"],
]);

// `wc -l` counts terminators, so a trailing newline is not a line. Matching it
// is what lets somebody check this number by hand and get the same answer.
const lines = (p) => {
  const t = readFileSync(p, "utf8");
  return t.split("\n").length - (t.endsWith("\n") ? 1 : 0);
};

// `paths:` frontmatter scopes a rule to the files it governs; without it the
// file is loaded at launch and is in context on every turn.
const unscoped = (p) =>
  !readFileSync(p, "utf8").split("\n").slice(0, 5).some((l) => l.startsWith("paths:"));

function tableRecords(text) {
  const out = [];
  for (const m of text.matchAll(/^\|\s*`(docs\/decisions\/[^`]+)`\s*\|/gm)) out.push(m[1]);
  return out;
}

function main() {
  const problems = [];

  const claudeLines = lines(CLAUDE);
  if (claudeLines < MIN_CLAUDE_LINES) {
    problems.push(`CLAUDE.md is ${claudeLines} lines — below the floor of ` +
                  `${MIN_CLAUDE_LINES}, so the standing rules have been moved ` +
                  `out with the records`);
  }

  let ruleLines = 0, exemptLines = 0;
  const swept = [];
  for (const name of existsSync(RULES) ? readdirSync(RULES).sort() : []) {
    if (!name.endsWith(".md")) continue;
    const p = join(RULES, name);
    const n = lines(p);
    if (EXEMPT.has(name)) { exemptLines += n; continue; }
    if (!unscoped(p)) continue;
    swept.push(`${name} (${n})`);
    ruleLines += n;
  }
  for (const [name, why] of EXEMPT) {
    if (!existsSync(join(RULES, name))) {
      problems.push(`the budget exempts \`${name}\` — "${why}" — and no such ` +
                    `rule file exists, so the exemption excuses nothing`);
    }
  }

  const loaded = claudeLines + ruleLines;
  if (loaded > MAX_LOADED_LINES) {
    problems.push(`${loaded} lines are loaded every turn (CLAUDE.md ${claudeLines} ` +
                  `+ ${ruleLines} unscoped rule lines) against a ceiling of ` +
                  `${MAX_LOADED_LINES}. Narrative has accreted again: move the dated ` +
                  `sections to docs/decisions/ and leave the standing rule behind.`);
  }

  // The records table, both directions. An empty sweep is refused rather than
  // reported clean: a table that stopped parsing and a repository with no
  // records print the same zero.
  const named = tableRecords(readFileSync(CLAUDE, "utf8"));
  const onDisk = (existsSync(RECORDS) ? readdirSync(RECORDS) : [])
    .filter((n) => n.endsWith(".md")).sort().map((n) => `docs/decisions/${n}`);

  if (!named.length) {
    problems.push("CLAUDE.md's records table named no record — either the table " +
                  "was dropped or its row format changed, and this check is " +
                  "measuring nothing rather than finding nothing");
  }
  for (const rel of named) {
    if (!existsSync(join(ROOT, rel))) {
      problems.push(`CLAUDE.md sends a reader to \`${rel}\` and it is not there`);
    }
  }
  for (const rel of onDisk) {
    if (!named.includes(rel)) {
      problems.push(`\`${rel}\` is a record CLAUDE.md's table does not name, so ` +
                    `nothing points at it — written, kept and unreachable`);
    }
  }

  if (problems.length) {
    problems.forEach((p) => console.error(`FAIL: ${p}`));
    process.exit(1);
  }

  console.log(`OK: ${loaded} of ${MAX_LOADED_LINES} lines loaded every turn — ` +
              `CLAUDE.md ${claudeLines}, unscoped rules ${ruleLines} ` +
              `[${swept.join(", ") || "none"}], exempt ${exemptLines}.`);
  console.log(`OK: ${named.length} record(s), each named by CLAUDE.md and each present.`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
