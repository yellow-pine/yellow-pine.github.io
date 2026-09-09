# yellow-pine.github.io — yellowpine.com

The Yellow Pine website. One hand-written `index.html`, served by GitHub Pages at
[yellowpine.com](https://yellowpine.com).

It is a **hook page**, not a brochure: who we are, what we have shipped, how to reach us.
Detail lives on [github.com/yellow-pine](https://github.com/yellow-pine), the way
[cansin.dev](https://cansin.dev) defers to its own profile.

`yellowpine.dev` is the redirect domain: it 301s here, apex and `www` alike. The apex moved
from `.dev` to `.com` on 2026-09-10, once `yellowpine.com` was finally ours.

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

Pages serves the default branch root. `CNAME` sets the domain.

**Point DNS at GitHub _before_ the domain lands in `CNAME`.** If Pages registers a custom
domain whose DNS still resolves elsewhere, certificate validation fails and GitHub never
retries on its own: Pages keeps serving over HTTP and `https_certificate` is absent entirely.

To recover, unset the custom domain and set it again, which re-runs validation:

```sh
gh api -X PUT repos/yellow-pine/yellow-pine.github.io/pages -F cname=null
gh api -X PUT repos/yellow-pine/yellow-pine.github.io/pages -f cname=yellowpine.com
```

Note `-F`, not `-f`: the API removes the domain only on a JSON `null`, and `-f` would send
the literal string `"null"`. Enable **Enforce HTTPS** in a separate call once the certificate
issues — passing `https_enforced` alongside `cname` 404s with "certificate does not exist
yet".

Unlike the old `.dev` apex, `.com` is not HSTS-preloaded, so HTTPS is not free here. **Enforce
HTTPS** is what redirects HTTP to HTTPS, and it has to be switched on once the certificate
issues rather than assumed.
