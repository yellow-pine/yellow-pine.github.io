# yellowpine.dev - design

**Date:** 2026-09-08
**Status:** approved, implementing

## Purpose

Give Yellow Pine a real website. Today `yellowpine.com` 302-redirects to
`github.com/yellow-pine`, so the org profile rendered from the `.github` repo *is* the
homepage. This adds a proper site at the newly purchased `yellowpine.dev`, standing to
the org profile the way `cansin.dev` stands to `github.com/cansin`.

## Decisions taken

| Question | Decision |
|---|---|
| Page role | Studio hook page. Short and confident; defers detail to GitHub. Not a full marketing site. |
| Hosting | GitHub Pages from a new public repo `yellow-pine/yellow-pine.github.io`, `index.html` + `CNAME`. |
| yellowpine.com | Unchanged. Keeps redirecting to GitHub. Revisit once this site has proven itself. |

## Non-goals

- No framework, no build step, no JavaScript. One hand-written file, as `cansin.github.io` does.
- No per-product marketing pages, screenshots, or long-form copy.
- No DNS or Squarespace changes to `yellowpine.com`.
- No new brand work. The identity is settled at v2.2; this consumes it.

## Visual language

Yellow Pine brand **v2.2**, taken from `yellow-pine/.github` `brand/README.md`. This is the
deliberate departure from the reference: `cansin.dev` runs pine green `#1e5a46`, which is a
personal identity and is explicitly forbidden here (pine-green dark breaks the pass/fail
semantics the palette was selected under).

| Role | Light | Dark |
|---|---|---|
| Surface | paper `#FCFCFC`, card `#FFFFFF`, hairline `#E7E7E5`, sunken `#F4F4F2` | bg `#161616`, surface `#202020`, raised `#2A2A2A`, border `#3A3A3A` |
| Text | `#202020`, secondary `#5A5A58`, tertiary `#6E6E6C` | `#F2F2F0`, secondary `#B7B7B4`, tertiary `#8F8F8C` |
| Links | `#1a75c8`, hover `#155F9F` | `#82BCF2`, hover `#9FCCF6` |
| Identity | `#FFD100` - the mark only | same |
| Selection | `#FFF7CC` wash with ink text | same |

Guardrails carried over verbatim from the brand spec:

- **`#FFD100` is identity only.** The inline mark and the sanctioned selection wash. Never
  text, never UI, never a functional icon.
- **Blue is interactive only.** Links and focus rings. Focus rings are azure in both modes,
  never yellow, to clear the 3:1 non-text gate.
- **Type:** Rubik 700 for display, system stack for body. Product UIs keep their own voices;
  this is umbrella brand, so it uses the brand face.

## Structure

Follows `cansin.dev`'s rhythm, which is a hook, not a brochure.

1. **Hero** - inline mark, `Yellow Pine`, "A small product studio", one-line thesis, lede,
   two actions (`Email us`, `GitHub`).
2. **Proof strip** - four verified facts in a 4-up grid, collapsing to 2-up on mobile.
3. **What we build** - the four shipped products, one line each, linked live.
4. **How we work** - the "Now" equivalent: a small team alongside AI agents, self-hosted
   model serving, agentic CI.
5. **Get in touch** - `hello@yellowpine.com`, plus GitHub.
6. **Footer.**

## Content source of truth

Copy derives from `yellow-pine/.github` `profile/README.md` so the site and the org profile
cannot drift. The same **publish rule** applies: a project appears only if it is a public
repo, or a private repo with a live public website. `grove`, `ai-runner-stack` and
`brand-assets` are therefore absent.

Proof-strip claims are limited to what was verified against the GitHub API on 2026-09-08:
org created 2021-09-12, 3 public repos, 9 stars, 4 shipped products, 2 hosted
(`latch.fyi`, `kishi.fyi`) returning 200. Private-monorepo PR counts are **not** used - they
are not publicly checkable.

## Assets

Both brand masters are small enough to inline, so the page has zero external asset
dependencies:

- `mark.svg` is 556 bytes - inlined as SVG in the hero.
- `icon.svg` is 659 bytes - inlined as a base64 `data:` favicon, the same technique
  `cansin.dev` uses.

Google Fonts is the one external origin, for Rubik, with `preconnect` and a full system
fallback stack.

## Testing

Ports the invariant style already established in the `.github` repo:

- every internal asset the page references exists;
- every `github.com/yellow-pine/*` link resolves **anonymously**, so nothing private can
  leak onto the site;
- every product URL is live;
- `CNAME` contains exactly `yellowpine.dev`;
- brand hex values in the page match the brand spec, and `#FFD100` never appears in a text
  or link role.

`npm test` runs them; `SKIP_NETWORK=1 npm test` skips liveness for offline work. CI runs on
push and weekly, matching the sibling repo.

## Deployment

1. Create public repo `yellow-pine/yellow-pine.github.io`.
2. Push; enable Pages on the default branch root.
3. `CNAME` file sets the custom domain; add the four `A` records (or an `ALIAS`) plus the
   `www` `CNAME` at Porkbun, then enable Enforce HTTPS once the cert issues.

`.dev` is HSTS-preloaded, so the site is HTTPS-only by construction. There is no HTTP
fallback to configure.
