# Glance — working notes

A quick-to-launch Windows desktop app for reading and editing Markdown:
double-click a `.md` and you are reading it in well under a second.

`README.md` is what it does and how to install it. `src/help.md` is the in-app
help. This file is the standing rules — the things that are easy to break
without noticing.

**This is one of TWO public repositories in the portfolio** — Glance and
**Redline**. Anything committed here is world-readable, permanently, including
in history. There are no customer files, no exports and no internal documents
in it and it must stay that way. Nothing in a checkout knows its own
visibility, so that claim is asked of GitHub rather than remembered.

## Run it

```bash
cd tests && npm ci && npx playwright test      # the frontend suite
cargo test --manifest-path src-tauri/Cargo.toml # the Rust half (needs GTK, below)
npm run dev                                    # the app (needs Rust + WebView2)
npm run build                                  # installer + portable exe (Windows)
```

The Playwright suite runs against `tests/server.mjs`, a static server over
`src/` — **no Tauri, no Rust, no Windows**. That is what makes the frontend
testable on any machine, and it is also the limit of what those tests can say:
they exercise the HTML/CSS/JS and nothing behind `__TAURI__`.

`.github/workflows/build.yml` runs the suite on Ubuntu **and** builds the
Windows installer on every push and pull request. It is verification only —
publishing lives in `release.yml`, so there is exactly one path that can
produce a release. No test count is written down here: nothing reads such a
number, so nothing turns red when it stops being true, and the runner prints
the current one.

## No framework, and no CDN

The UI is plain HTML/CSS/JS. That is the point rather than an accident: a Tauri
binary is a few megabytes of native code rendering through the WebView2 runtime
Windows already ships, and there is no bundled browser to page in from disk —
which is what makes an Electron app feel slow to launch. A framework would put
the cost back.

Every library is **vendored into `src/vendor/`** — markdown-it and its plugins,
highlight.js and its themes. A CDN load would break offline use and put a third
party in the path of a file the user opened locally.

## The version is in six places, and the tag is a seventh

`package.json`, `package-lock.json` **twice** (the root entry *and*
`packages[""]`), `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and
`src-tauri/Cargo.lock`'s own `glance` entry. The `v*` tag is a seventh that no
file can see.

`scripts/check-versions.mjs` reads all six and takes the tag as an optional
argument. **One implementation, two callers** — `build.yml` runs it bare on
every push, `release.yml` with the tag — so the release cannot check less than
every push already did. A site it cannot READ is a failure, never a skip; the
Cargo pair is found by anchor rather than by first match.

## Three account strings, and one of them must NOT be edited

`package.json`'s `repository.url` and `src-tauri/Cargo.toml`'s `[package]
repository` are literals, because neither format can derive a URL.
`scripts/check-metadata.mjs` compares both against **this checkout's own
origin** — the oracle is git, never the other manifest — and reports a checkout
with no GitHub remote rather than failing it.

**`src-tauri/tauri.conf.json`'s `identifier` is FROZEN.** Nothing resolves an
identifier, so an account move cannot break one; what a rewrite breaks is
NSIS's upgrade registry entry, and the next installer sits *beside* the
previous install instead of replacing it. It is pinned by digest, and it is
deliberately not quoted here — a second copy is a second thing a
find-and-replace reaches on the one day somebody is reaching for all of them.

## The notices have to ship INSIDE the installer

`THIRD-PARTY-NOTICES.md` at the repository root satisfies nothing for somebody
who downloads an `.exe`. MIT, ISC and the BSD licenses require the notice to
travel with the **distributed form**, so `bundle.resources` in
`src-tauri/tauri.conf.json` copies `LICENSE`, `THIRD-PARTY-NOTICES.md` and
`licenses/` into the bundle. **A repository can look fully compliant while
every shipped binary is not**, so adding or replacing a vendored library means
updating the notices *and* checking they are still in `resources`.
`.claude/skills/license-and-release/` is the procedure, including the audit.

Glance's own code is **0BSD** — no attribution required, no fee. A deliberate
choice rather than a reflex "MIT", which *requires* attribution from every
redistributor.

## The bytes the file arrived with are the bytes it leaves with

A read is forgiving and a **write is not**, and the pair is the whole rule.
`read_text_file` answers `{ text, lossy, bom, eol }`; `write_text_file` takes
`bom` and `eol` back and restores them before it writes a byte.

- **A document read lossily opens READ-ONLY, on the textarea**, so it cannot
  become dirty — a guard only at save lets somebody type for an hour first. The
  backend refuses the write as well, and `replaceRange` refuses too, because
  `setRangeText` ignores `readOnly` and every toolbar button goes through it.
- **A BOM is stripped for display and restored on write**; a BOM in front of
  the first `#` stops it being a heading.
- **A textarea normalizes CRLF to LF**, so a CRLF file opened dirty and Ctrl+S
  rewrote every line ending. `"mixed"` is a third answer rather than a guess,
  and those open read-only too.
- **Save As does not inherit the source's encoding**, and the document adopts
  what was actually written.

## Live view is a fourth view, and three things about it are load-bearing

`docs/live-preview-notes.md` is the design record and the measurements.

- **The textarea is never moved, re-parented, or assigned `.value`** — it holds
  the whole document and is shrunk to the caret's block and parked over the gap
  that block leaves in a rendered column. Re-parenting a textarea destroys its
  native undo stack (measured, in the notes), so any change that reaches for
  `appendChild` here silently costs per-tab undo, and nothing on screen says so.
- **`#selMirror` becomes `position: fixed` in live view**, because an absolutely
  positioned full-height mirror is inside `#editorPane`'s scrollable overflow and
  would stretch its scroll range by the height of the raw document (79,628px on
  a large-document probe). Only differences between its rects are used in this
  view, so where it sits does not matter — but it must not be in the scroller.
- **The reveal is driven off `keydown`/`keyup`, not `selectionchange` alone.**
  Chromium throttles `selectionchange`: six arrow presses produced two events,
  and the reveal fell several lines behind the caret. A caret-following feature
  built on that event alone will look broken and test green if the test waits.

## Things the Playwright suite cannot see

- **Anything behind the Tauri bridge** — file dialogs, saving, file
  associations, tear-off windows, the single-instance forwarding that makes a
  second double-click add a tab instead of launching another copy.
- **Launch speed**, which is the product's whole claim.
- **What the installer contains**, including the notices above.

So a change to `src-tauri/` is verified by building and running it, not by a
green tick. Say which of the two you did. `printing` is the worked example: the
guard is one `beforeprint` listener and its output lands on paper, which is the
one place a user cannot check first.

## `test-results/` is Playwright's, not a fixture

It is generated output from a run. Do not commit anything into it and do not
read it as a record of anything but the last local run.

## The records

A closed defect narrative is a **record**, not an instruction, and it does not
belong in a file loaded on every turn. Each is dated, keeps its measurements,
and is worth reading before re-opening the subject it covers.

| record | read it before |
|---|---|
| `docs/decisions/versions-and-the-account.md` | touching a version declaration, `check-versions.mjs`, `check-metadata.mjs`, or any account literal |
| `docs/decisions/bytes-the-editor-could-not-hold.md` | touching `read_text_file`, `write_text_file`, or anything that decides whether a document is editable |
| `docs/decisions/three-gates-that-did-not-exist.md` | touching `check-notices.mjs`, the Rust lint/test steps, or printing |

`scripts/check-docs.mjs` gates this file's length and resolves the table
against the directory in both directions, so a record cannot be quietly dropped
and this file cannot quietly grow back.
