# What the file had and the editor could not hold

Closed records: the lossy-UTF-8 destruction, and the BOM and CRLF a textarea
normalizes away. `CLAUDE.md` carries the standing rule.

## A file with any non-UTF-8 byte was destroyed by open-then-save

`read_text_file` ended `String::from_utf8_lossy(&bytes).into_owned()` under a
comment defending exactly that: *"Be forgiving about encoding: replace invalid
UTF-8 rather than failing."* **That comment is right, and it covers reading.**
Nothing covered writing the replacements back over the original — so a file
holding one `0xE9` opened as `caf\u{FFFD}`, and the next Ctrl+S put the
substitute on disk. The byte is gone, permanently, and no undo in this app
reaches it.

**Silent destruction of a user's file was the default by accident rather than
by choice**, which is the whole shape: nobody decided it, the tolerance was
defensible where it was written, and the consequence lived one function away.

- **The tolerance stays. What travels with it is the FACT.** `read_text_file`
  answers `{ text, lossy }` rather than a `String`, because a caller handed
  only the text cannot tell a faithful read from a lossy one — and the caller
  is what decides whether to offer a save, which is the act that makes the loss
  permanent. Refusing to open would be worse: a file with one stray byte should
  still be legible.
- **Detect-and-preserve is the better end state and is deliberately not
  attempted.** Reading Latin-1 as Latin-1 and writing it back is what the file
  deserves; guessing an encoding wrong is its own way to corrupt one, and this
  fix had to be one nobody can get wrong. Read-only with a reason is cheaper and
  strictly safer.
- **Two guards, and the second is not the first restated.** The frontend opens
  the document read-only — **on the textarea**, so it cannot become dirty in the
  first place; a guard only at save would let somebody type for an hour and then
  be told. `write_text_file` then refuses the write itself, which is the backstop
  for every route that forgets, because a save is the one act that is not
  recoverable.
- **The backend refusal is a CONJUNCTION, and both halves keep it a backstop
  rather than a rule that blocks real work.** The file on disk must be invalid
  UTF-8 *and* the text being written must still carry a U+FFFD. Saving fresh
  text over a Latin-1 file is a person replacing a document and passes; a
  document that genuinely discusses U+FFFD saved over a valid file passes.
  Refusing every write to a non-UTF-8 path would have been the obvious rule and
  is the one that gets switched off.
- **`readOnly` on the textarea stops keystrokes and nothing else, so the
  refusal also lives in `replaceRange`.** `execCommand` honours `readOnly` and
  returns false; `setRangeText` — the fallback one line below it — does not,
  and writes anyway. So every toolbar button, every formatting hotkey and live
  view's checkbox click went *around* the textarea's own refusal: Bold on a
  lossily-read file turned `# caf\u{FFFD} notes` into `# **caf\u{FFFD}** notes`,
  dirty, with the backend refusal the only thing left to catch it at save —
  which is precisely the "type for an hour and then be told" this guard exists
  to prevent. One `setRangeText` call site in the file, so one place to refuse.
  Falsified by neutering the check: the toolbar test fails.
- **Save As is the way out, so it has to actually let go.** The document is then
  bound to a file this app wrote and can reproduce exactly, so `readOnly` clears
  on a successful write to a different path. A remedy that leaves the copy
  read-only is worse than none, because it is offered.
- **`read_only` travels with a torn-off tab**, spelled the same in Rust and JS.
  Every other `HandoffDoc` field is one word, so there is no camelCase
  convention to follow and a `serde(rename)` would put two spellings of one
  field in play — which is how a sibling project's `element_name` arrived in JS
  as `undefined` and failed silently.

### The banner is ABOVE the panes, and both reasons are structural

- Read view sets `#editorPane { display: none }`, and a read-only document is
  exactly what a person reads — a banner inside that pane would be invisible in
  the view it matters most in.
- `#selMirror` and `#selOverlay` are positioned against `#editorPane`, the
  overlay at `inset: 0`. Taking vertical space at the top of that pane moves the
  textarea without moving their origin, which is a column-selection drift
  nothing on screen would explain. Twenty-four of the suite's tests are column
  selection.

It is a strip rather than a toast because the reason has to stay on screen: a
toast that has faded leaves an editor that silently will not accept a keystroke.

### This file had no Rust tests at all, and that is why the defect could sit there

`src-tauri/` is behind the Tauri bridge, which the section below says the
Playwright suite cannot see — so the code deciding whether a file is about to be
destroyed was gated by **nothing**. `decode_for_display` and
`write_would_destroy` are pure for exactly that reason: a rule that only exists
inside a `#[tauri::command]` is a rule no check can reach. Eight tests, and they
cover both directions — an `empty_is_not_lossy` floor, because a rule answering
"lossy" to everything would satisfy every assertion about the destruction case
and open nothing.

**`cargo test` needs GTK in this container** and fails on `gdk-3.0` without it;
`apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev` fixes it, which is worth
doing rather than shipping a Rust change verified by reading. The sibling
Decant repo records the same one-line remedy.

Falsified six ways, each on its own test: the lossy flag dropped in `openPath`
(4 fail), the textarea's `readOnly` never set, the save refusal removed, Save As
no longer clearing it, `showDoc` no longer refreshing the banner (3 fail), and
`write_would_destroy` neutered to `false`.

**And the first draft of the test stub broke the file it was in.** A comment
inside `tauriStub`'s template literal wrote `` `{ text, lossy }` `` in backticks,
which **ends the template literal** — and the parse error named a line thirty
lines from the cause, reported as `No tests found`. No backticks inside that
stub.

## Two more facts the file had and the editor could not hold

The section above is about a read that *loses* something. These two lose
nothing on the way in — both decode faithfully — and are then written over,
because **what a `<textarea>` can hold is narrower than what a file
contains**. Same shape, one level down, and the same answer: strip it for
display, report it, put it back on write.

- **A BOM is valid UTF-8**, so it reached markdown-it, where it sits in front
  of the first `#` and stops it being a heading. Measured in a real browser
  before anything was changed: `render("﻿# Title\n\ntext")` gives
  `<p>﻿# Title</p>` and the same string without it gives `<h1>Title</h1>`.
  **The first heading of every BOM'd file rendered as body text**, and nothing
  was wrong with the read.
- **A textarea normalises its value to LF.** Measured: `ta.value = "a\r\nb"`
  reads back `"a\nb"`. So a CRLF file **opened dirty** — `d.content` came back
  from the editor as LF against a `savedContent` that was CRLF — and Ctrl+S
  wrote LF over every line ending in the file.

`read_text_file` answers `{ text, lossy, bom, eol }`; `write_text_file` takes
`bom` and `eol` back and restores them before it writes a byte.

- **`"mixed"` is a third answer rather than a guess**, and it is the whole
  reason `eol` is not a bool. Restoring a dominant ending over a file that
  genuinely mixes them rewrites the minority in silence — the defect being
  fixed, wearing a smaller number. Those open read-only with a reason, exactly
  as a lossy read does, and Save As is the way out. The backend refuses that
  write too, and refuses it **before** composing anything, because a refusal
  after the work is a refusal that first made somebody wait for it.
- **The refusal is keyed on what the READ reported, never on the file.**
  `eol == "mixed"` can only come from a caller writing back a file this app
  flattened; *"the file on disk is mixed"* would refuse a person deliberately
  replacing such a file, which is the over-broad rule `write_would_destroy`'s
  conjunction already declines to be.
- **A lone `\r` is not a line ending.** No textarea and no markdown renderer
  treats one as a break, so calling a file that contains one CRLF or LF would
  invent a fact about it. A file whose only breaks are lone `\r` reads `"lf"`
  and has no `\n` to restore, which changes no byte.
- **Save As does not inherit the source's encoding.** It writes a *different*
  file, and giving that one a BOM and CRLF the user never chose is the same
  silent rewrite pointed at a new path. The document then **adopts what was
  actually written**, so the next save round-trips this file rather than the
  one it came from — the same reasoning that clears `readOnly` there.
- **Both travel with a torn-off tab**, like `read_only`, and for a sharper
  reason: `open_in_new_window` rebuilds the document from scratch, so a CRLF
  file torn off and saved in the new window would have every ending rewritten
  — this defect surviving in the one path that starts over.
- **Both default to "no" in the backend**, so a caller that passes neither — a
  new document, or any route added later — writes plain LF with no BOM, which
  is what this app produces on its own.

### It was verified by running it, which is what the section below asks for

`cargo build`, `cargo test` (16) and 100 Playwright tests are three green
ticks over three things that are not the application. So the built binary was
launched under Xvfb with a real BOM + CRLF file as `argv`, driven with
`xdotool`, and the bytes read back off disk:

| | on open | after typing and Ctrl+S |
|---|---|---|
| before | `● bomcrlf.md - Glance` — **dirty with nothing typed** | `EF BB BF … \n … \n … \n ZZZ` |
| after | `bomcrlf.md - Glance` | `EF BB BF … \r\n … \r\n … \r\n ZZZ` |

The typed `ZZZ` is what makes the second column a measurement rather than a
tautology: a save that never fired leaves the file unchanged too.

**The first window was the wrong window.** `xdotool search --pid` returns two
toplevels and the first is named `glance` — the process, not the document — so
the first reading said the title had never been set. The real one is found by
its `_NET_WM_NAME`, which is Decant's own recorded rule for the same script.

### Falsified, each arm on its own defect

Rust, six ways: the BOM strip removed (2), the CRLF flatten removed (2),
`eol_of` blinded to a bare LF (1), the BOM never restored (1), CRLF never
restored (2), and — the floor — CRLF restored **unconditionally**, which fails
`a_caller_that_passes_nothing_writes_plain_lf`.

Frontend, six ways: `openPath` dropping the pair (3 fail), Save As inheriting
the source encoding (1), the `mixed` reason dropped (1), the handoff dropping
the pair on the *receiving* side (1), the document not adopting what was
written (1), and the floor again — `bom: true, eol: 'crlf'` unconditionally,
which fails **8**, five of them tests that predate this change.

**Three of those injections would not apply and said so.** Each rewrite
asserts its anchor changed the file, because an injection that does not apply
reads exactly like a dead gate — and the first three attempts here were
mangled escaping rather than a check that did not fire.

### The stub decodes the way the backend does, and its files hold RAW text

`tauriStub`'s `files` are what is *on disk*, BOM and CRLF included, and the
stubbed `read_text_file` strips and flattens exactly as Rust does. A stub that
stored the display text could never be asked the byte question, which is the
whole claim these tests make — the same rule that already made it answer
`{ text, lossy }` rather than a bare string.
