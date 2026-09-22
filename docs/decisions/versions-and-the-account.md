# Versions, and the account written down twice

Closed records. `CLAUDE.md` carries the standing rule; this is the evidence
behind it and the reasoning a later reader needs before re-opening either
subject.

## Six version declarations, the tag is a seventh, and one script reads them all

Five files carry the version at **six sites**: `package.json`,
`package-lock.json` twice (the root entry *and* `packages[""]`),
`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`'s
own entry for the `glance` crate. The `v*` tag is a seventh that no file can see.

**Until now exactly one of them was ever read.** `release.yml` compared the tag
against `tauri.conf.json`, at tag time; `build.yml`, which runs on every push and
pull request, checked none. So five sites could drift for weeks and the first
sign would be a release whose installer is named after a different version than
the app reports — the failure the tag check exists to prevent, arriving through
the door it does not watch.

The tell was in the workflow's own error message: it named *"Cargo.toml,
package.json, the lockfiles"* as the files to update, which is four declarations
it was not looking at. **A message that lists what a check does not check is the
check telling you its own scope.**

`scripts/check-versions.mjs` reads all six and takes the tag as an optional
argument. **One implementation, two callers** — `build.yml` runs it bare on every
push, `release.yml` runs it with the tag — so the release cannot check less than
every push already did, and a second copy of *where are the versions* cannot
disagree with the first.

- **A site it cannot READ is a failure, never a skip.** *"I could not extract
  this one"* and *"this one agrees"* must not share an outcome, which is this
  portfolio's standing rule about a check that stops measuring rather than
  failing. Falsified by renaming the crate in `Cargo.lock`: the run reports
  `UNREADABLE` and exits 1.
- **Cargo's two are found by anchor, not by first match.** The TOML version is
  taken after the `[package]` header — the first `version =` in the file becomes
  a dependency's the moment one is added above it — and the lockfile's is found
  by `name = "glance"`, so a crate that happens to sort nearby cannot answer for
  it.
- Falsified four ways: `package.json` bumped alone, `Cargo.toml` alone,
  `package-lock.json`'s `packages[""]` alone, and a site made unreadable. All
  four exit 1.

## The account is written down twice, and nothing would have said when it went stale

Ahead of moving these repositories to a company account, every site naming
`MoogMan1073` was swept. **Glance has no executing one** — no workflow checks a
sibling out, nothing installs from git, nothing dispatches — which is the
honest headline: the move breaks no build here. What it leaves is two
`repository` declarations, `package.json`'s `repository.url` and
`src-tauri/Cargo.toml`'s `[package] repository`, and both are **literals
because neither format can derive a URL**.

**A wrong one is silent.** Nothing reads either field at runtime, so the app
builds, installs and launches exactly as before while pointing every reader at
a repository that is not this one — and this is one of the two PUBLIC
repositories, so that URL is what somebody follows. A repository RENAME would
survive it on GitHub's redirect, which is precisely why it has never mattered;
a repository recreated fresh under another account leaves no redirect at all.

`scripts/check-metadata.mjs`, run by `build.yml` beside `check-versions.mjs`
and `check-notices.mjs` — the same argument those two already make, that a gate
firing only at release time finds out too late.

- **THE ORACLE IS GIT, never the other manifest.** Comparing the two files
  against each other says only that they agree, which they would while both
  were stale together — *a staleness check that consults the same source as the
  claim will agree with it*. The arm that makes both wrong at once fires.
- **Three states, never two.** A checkout with no GitHub `origin` — a tarball,
  a fork pushed elsewhere — cannot answer the question, and that is not the
  same as answering it correctly. It reads and parses both files, says it could
  not compare them, and exits 0; failing a build for having no remote is how
  this becomes a nuisance somebody removes.
- **The `[package]` anchor rather than the first `repository =`**, which is
  `check-versions.mjs`'s own recorded rule one field over: the first match in a
  Cargo manifest becomes a dependency's the moment one is added above it.
- **A floor at exactly two.** *"Every declaration agrees"* is true of a run that
  found none, and a renamed key is exactly how this check would stop reading
  anything while still printing OK. Both arms fire, and the message names which
  two it expects.
- **AND THE PARSE NEEDED ITS OWN FLOOR, which the falsification found.** The arm
  that gives `accountFromUrl` a hardcoded fallback came back **DEAD** — because
  *both sides of the comparison go through it*, so one that answers a constant
  makes the manifests agree with git whatever any of the three says. On a
  correct tree every URL matches and the fallback is unreachable, so there is
  nothing for an injection to injure. Eight URL shapes are asserted on the parse
  directly now, and the same arm fires.

Falsified six ways, each on its own arm and every one firing: either manifest
naming another account, both naming it together, `package.json`'s key removed,
the Cargo `[package]` anchor renamed, and the parse no longer discriminating.

### The move landed, and the section above names two of the FOUR sites a sweep finds

`package.json:9` and `src-tauri/Cargo.toml:7` name `DSI-codebase/Glance` as of
2026-09-19. **`check-metadata.mjs` was red before the edit and green after, on
exactly those two lines** — so the gate written ahead of the move is what
located it, rather than a sweep somebody ran by hand.

What the section does not say is the half worth adding. A case-insensitive
sweep of the tracked tree finds **four** sites, and the two it omits are the
two a reader following the heading gets wrong:

| site | what the move does to it |
|---|---|
| `package.json`'s `repository.url` | **edited** |
| `src-tauri/Cargo.toml`'s `[package] repository` | **edited** |
| `src-tauri/tauri.conf.json`'s `identifier` | **FROZEN — the rewrite is the damage** |
| this file, the sweep sentence above | a dated record; rewriting it destroys the observation |

- **THE IDENTIFIER IS THE TRAP, AND IT IS INVISIBLE TO THE SWEEP THAT FINDS
  THE OTHER THREE.** It is `io.github.<account>.glance` — the value is in
  `src-tauri/tauri.conf.json:5` and is deliberately not repeated here, for the
  reason the next paragraph measures. Lowercase reverse-DNS, so a grep keyed on
  the remote's own spelling misses it entirely and a case-insensitive one
  offers it beside two lines that must be edited. Nothing
  resolves an identifier, so the move cannot break it; NSIS keys the Windows
  upgrade registry entry on it, so a rewrite makes the next installer sit
  **beside** the previous install rather than replacing it.
  `check-metadata.mjs` pins it by sha256 — not by comparing it against the
  remote, which is right on move day and red for ever after, and not as a
  literal, which would put a second copy of the string in the file that counts
  them. Its header carries that reasoning; what announces it on the day is the
  do-not-edit table in Pathforward's `docs/COMPANY-ACCOUNT-MOVE.md`. One
  mechanism per job.
- **BOTH PROBLEM KINDS ARE REPORTED IN ONE RUN, deliberately.** Exiting on the
  two `repository` failures first leaves the reader editing all three account
  strings by analogy and meeting the do-not-edit line on the next run, by which
  time the identifier is already rewritten.
- **THE NAMED-BY-ONE-FILE CHECK FIRED ON THIS WRITE-UP, which is the strongest
  evidence it is load-bearing.** The first draft of the bullet above quoted the
  identifier verbatim, and `check-metadata.mjs` went red naming
  `["CLAUDE.md","src-tauri/tauri.conf.json"]` — correctly, because a second
  copy in the design record is a second thing a find-and-replace reaches on the
  one day somebody is reaching for all of them. This is the dead-gate trap
  **inverted**: the usual failure is a check satisfied by the comment explaining
  the defect, and here the check fires on it. The responses are opposite —
  there, tighten the check; here, fix the document. **Never add an exemption for
  the text explaining the thing**, which would be a waiver aimed at exactly the
  file most likely to carry it.
- **"Nothing reads either field at runtime" is a MEASUREMENT now rather than a
  claim.** Zero occurrences of `CARGO_PKG_REPOSITORY` and zero of any
  `CARGO_PKG_*` under `src-tauri/src/`, and the field is named in neither
  `build.rs` nor `tauri.conf.json` — so the Cargo edit cannot reach compiled
  behavior. `cargo metadata` reads the new value, and `Cargo.lock` names the
  account **0** times: its 509 `github.com` hits are all
  `rust-lang/crates.io-index`, which is the registry rather than an owner.

**Which gates passed, and the one that did not run.** The three
dependency-free checks exit 0; the Playwright suite is **126 passed**;
`cargo fmt --all -- --check` is clean, `cargo clippy --all-targets -- -D
warnings` is clean, and `cargo test` is **16 passed, 0 failed**. The two Rust
gates needed the GTK install this file already records as worth doing — with
`apt-get update` first, since the image's cached lists 404 on two archives.
**`npm run build` did NOT run**: it bundles through NSIS on `windows-latest`,
and the Windows job is its first execution, exactly as the section on that
platform says.

## ...and the visibility claim itself was checked rather than remembered

That line said *"the one PUBLIC repository"* until 2026-08-29, and it was
checked against the account rather than remembered: `list_repos` reports
`visibility` per repo, and two of the fourteen come back public. **A claim
about which repositories are private is exactly the kind that goes stale
silently** — nothing in a checkout knows its own visibility, so the only way to
find out is to ask GitHub. Redline was swept at the same time and is clean: no
drawing files, exports or archives in 172 commits, no customer names in tracked
files, and its private-PyDRC install uses `${{ secrets.PYDRC_TOKEN }}` with no
literal token ever committed.
