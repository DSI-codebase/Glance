# Three invariants this repository stated and nothing checked

Closed record. Each was a sentence in a document and a rule enforced nowhere;
all three are gates now, and `CLAUDE.md` names them.

## Three invariants this file states and nothing checked

Each is written down here or in `CONTRIBUTING.md` as a rule somebody must
remember. Two sections above already say what that is worth: *a repository can
look fully compliant while every shipped binary is not*, and *a change to
`src-tauri/` is verified by running it, not by a green tick*. Now they are
gates.

### The notices, checked against what actually ships

`scripts/check-notices.mjs`, run by `build.yml` on every push beside
`check-versions.mjs` — a gate that only runs at release time finds out too
late. Three claims, each asked of the artifact:

- **Every file in `src/vendor/` is covered by a notice, and every coverage
  claim names a file that exists.** Both directions, so a library cannot be
  added without somebody saying which entry covers it, and a stale entry
  cannot sit there naming a file that is gone. `COVERED_BY` is a **declared
  map, not a filename rule**, because the two disagree exactly where it
  matters: `highlight.min.js` is "highlight.js" and `hljs-github-dark.min.css`
  is covered by a themes row — the two entries the notices themselves bold as
  the ones a quick skim gets wrong.
- **Every `bundle.resources` path exists**, and the three the obligation rests
  on are among them. Tauri copies what it finds, so a path that stopped
  resolving does not fail the build.
- **Every license the notices attribute a component to has its text**, inline
  for the short ones and in `licenses/` for Apache-2.0 and Unicode-3.0. The
  license names are read out of the notices' own tables rather than listed in
  the script, because a list in the script is a second copy of the document
  and the document is the thing that drifts.

Falsified eight ways, each naming its own finding: an unattributed vendored
file, `resources` emptied, `licenses/` dropped from it, a resource that no
longer exists, the ISC text removed, `licenses/Apache-2.0.txt` deleted, a
stale `COVERED_BY` entry, and the notices' tables emptied (the floor).

### `npm run build` was the Rust shell's only gate, and it is a compile

`build.yml` ran no `cargo test`, no `clippy`, no `fmt` — so the functions
deciding whether a file is about to be destroyed on save were checked by
nothing but whether they compiled. All three run now, **in the Windows job
rather than a job of their own**: the toolchain, the cache and the platform
dependencies are already there, and a second job would compile the tree twice
for no extra signal. They run **before** the build, so a lint failure is
reported as a lint failure rather than as a build that fell over.

Windows-only, with the reason written into the workflow so nobody "fixes" the
asymmetry — that is the platform the app ships on, and `cargo test` on ubuntu
needs the GTK/WebKit stack installed for a target nothing here builds for.

### Printing put the last render on paper, not the tab you are on

`@media print` hides the toolbar, the tab strip and the editor and **un-hides
`#previewPane`**, so printing from Edit view puts the preview on paper whether
or not anybody has looked at it — and switching tab in Edit view never
re-renders, because there is nothing on screen to re-render. The whole guard
is one `beforeprint` listener, and **no test in the suite mentioned printing
at all**. The failure is silent and lands on paper, which is the one place
this app's output goes that a user cannot check first.

- **The premise is asserted first.** A test that only dispatched
  `beforeprint` and found the right heading would pass over a guard that does
  nothing, if the app happened to re-render on the tab switch — so the preview
  is asserted to be showing the *other* document before the event.
- **`page.emulateMedia({ media: 'print' })`** is what makes the first half a
  measurement rather than an argument: in edit view the preview is hidden, and
  under print media it is visible and the editor is not.
- **Both directions.** A guard that re-rendered on every `beforeprint` would
  satisfy the first test and throw away the preview's scroll position on every
  print of an untouched document, so a probe attribute on the rendered node
  asserts nothing was rebuilt.

Falsified three ways, each on its own arm: the listener removed, the
staleness test dropped, and `display: block !important` taken off
`#previewPane` in the print block.
