# yellow-pine.github.io — yellowpine.dev

The Yellow Pine website. One hand-written `index.html`, served by GitHub Pages at
[yellowpine.dev](https://yellowpine.dev).

It is a **hook page**, not a brochure: who we are, what we have shipped, how to reach us.
Detail lives on [github.com/yellow-pine](https://github.com/yellow-pine), the way
[cansin.dev](https://cansin.dev) defers to its own profile.

`yellowpine.com` is unrelated to this repo and still redirects to the GitHub org.

## Contents

- [`index.html`](index.html) — the entire site. No framework, no build step, no JavaScript.
- [`CNAME`](CNAME) — the custom domain.
- [`tests/`](tests/) — invariants, run by [CI](.github/workflows/ci.yml) on push and weekly.
- [`docs/superpowers/specs/`](docs/superpowers/specs/) — the design that produced it.

## Brand

Identity **v2.2**, consumed from the canonical library in
[`yellow-pine/.github`](https://github.com/yellow-pine/.github/tree/main/brand). Nothing is
redefined here; the page inlines the mark and icon masters and copies the tokens.

The page is built on the one surface the brand licenses for the identity yellow: the
`#202020` chassis. It runs full-bleed as the masthead, holds the lockup, and stays the same
dark in both themes — only the paper below it flips — so the mark is always a fill on dark
and never text on light.

The lockup is **live type**, not the outlined wordmark master: `Yellow`, the mark master as
inline SVG, `Pine`, set in Rubik 800 on one line. It scales with the type ramp, inherits its
colour from the chassis token, stays selectable and searchable, and the mark is
`aria-hidden` so the `h1` announces exactly "Yellow Pine".

Two guardrails the tests enforce, because they are easy to violate by accident:

- **`#FFD100` is identity only** — the mark, and the sanctioned `#FFF7CC` selection wash.
  Never text, never a link, never functional UI.
- **Blue is interactive only** — links and focus rings, azure in both modes. Focus rings are
  never yellow; it cannot clear the 3:1 non-text contrast gate.

The page has no external asset dependencies. The mark is inline SVG and the favicon is the
icon master as a `data:` URI. Google Fonts is the sole external origin, for Rubik, behind a
full system fallback stack.

## The publish rule

Inherited from the org profile: a project appears here only if it is a **public repo, or a
private repo with a live public website**. The tests enforce the mechanical half — every
`github.com/yellow-pine/*` link is fetched anonymously and anything not publicly visible
fails the build, so nothing private can leak onto the site.

## Tests

```sh
npm test                  # all invariants
SKIP_NETWORK=1 npm test   # offline: skip link-liveness
```

## Deploying

Pages serves the default branch root. `CNAME` sets the domain. `.dev` is HSTS-preloaded, so
the site is HTTPS-only by construction — there is no HTTP fallback to configure. After the
DNS records point at GitHub, enable **Enforce HTTPS** once the certificate issues.
