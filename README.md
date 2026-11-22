# GraphQL-Markdown + Zola demo

This project demonstrates how to generate GraphQL documentation with GraphQL-Markdown for a [Zola](https://www.getzola.org) static site, using a small custom template set.

**Live demo:** [graphql-markdown.dev/demo-zola](https://graphql-markdown.dev/demo-zola/)

## Quick start

Requires Node.js 22+ and Zola 0.23.6.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:1111/` and use the API reference link in the header.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run generate` | Fetches the schema and writes Markdown into `content/graphql/` |
| `npm run dev` | Generates the docs, then runs `zola serve` |
| `npm run build` | Generates the docs, then runs `zola build` into `public/` using the `base_url` from `config.toml` |
| `npm run build:local` | Same as `build`, but with `--base-url http://localhost:4173` so links resolve when serving locally (used by the visual tests) |
| `npm run clean` | Removes `content/graphql` and `public` |
| `npm run test:visual` | Runs the Playwright screenshot tests against `public/` (Argos upload only in CI with `ARGOS_TOKEN`) |

## Project structure

```text
.
├── content/
│   ├── _index.md               # Landing page (uses templates/index.html)
│   └── graphql/                # Generated GraphQL documentation
├── static/
│   └── gqlmd.css               # Site styles, copied as-is
├── templates/
│   ├── base.html               # Layout with header and sidebar navigation
│   ├── index.html              # Landing page template
│   ├── page.html               # Entity and operation pages
│   └── section.html            # Section listing pages
├── scripts/
│   ├── custom-zola-mdx.mjs     # Wrapper that extends the Hugo preset for Zola
│   └── generate-docs.mjs       # GraphQL-Markdown runner
├── tests/visual/
│   └── site.spec.ts            # Playwright + Argos screenshots
├── config.toml                 # Zola configuration
├── playwright.config.ts        # Visual test configuration
└── package.json
```

## Deployment

The `deploy.yml` workflow runs on pushes to `main`. It installs Zola 0.23.6 from the GitHub release tarball, runs `npm ci` and `npm run build`, then publishes `public/` to the `gh-pages` branch with `ghp-import`.

## Visual tests

```bash
npm run build:local
npx playwright install chromium
npm run test:visual
```

The tests serve `public/` on port 4173 (override with `VISUAL_PORT`) and capture desktop and mobile screenshots of the landing page, one page per GraphQL type kind, and dark mode variants.

## How the formatter differs from the Hugo preset

The custom formatter in `scripts/custom-zola-mdx.mjs` starts from `@graphql-markdown/formatters/hugo` and changes the parts Zola handles differently:

- **Front matter:** Zola only accepts a fixed set of top-level keys. Hugo's `id` is moved under `extra:`; other non-whitelisted keys are moved there too.
- **Internal links:** Links are written as Zola's checked `@/…md` form, relative to `content/`, with anchors preserved (for example `@/graphql/types/scalars/id.md`). External links are unchanged.
- **Admonitions:** Rendered as plain blockquotes with a bold title instead of GitHub-style `> [!TYPE]` alerts.
- **Section pages:** Every section gets an `_index.md` with `sort_by: "title"`, so Zola lists child pages alphabetically. `generate-docs.mjs` creates a minimal `_index.md` for any directory that holds pages but has none.

## Notes

- The documented schema is the [shared GraphQL-Markdown demo schema](https://github.com/graphql-markdown/graphql-markdown/blob/main/tests/e2e/__data__/demo_schema.graphql) used by all GraphQL-Markdown demos, loaded from its raw URL at generation time. Generation needs network access.
- `base_url` in `config.toml` points at the GitHub Pages project URL; use `build:local` when serving from another origin.
