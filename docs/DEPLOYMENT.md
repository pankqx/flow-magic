# Development, Configuration and Deployment

## Local development (finalised at FM-101)
- Supported OS: macOS, Linux, Windows (WSL recommended). Node: current LTS (record in `.nvmrc` and `package.json` `engines`). Package manager: npm.
- Commands: see `AGENTS.md` §4 (`dev`, `build`, `typecheck`, `lint`, `format:check`, `test`, `test:e2e`, `validate:content`, `check`).
- Environment variables: none required for the MVP. If any are introduced later, commit `.env.example` with placeholder names only and validate at startup.
- Troubleshooting section added to README after FM-101.

## Deployment
- **MVP**: static build (`npm run build` → `dist/`) on any static host with Git integration. Candidates: Netlify, Vercel, Cloudflare Pages, GitHub Pages (needs `base` path set). Choose at FM-116 (OPEN_QUESTIONS Q4); the choice is low-stakes and reversible.
- Deploy from `main` after CI is green; preview deploys per PR if the host supports them.
- Set the CSP header (SECURITY_PRIVACY §3) via the host's config file; test that the app works under it.
- Rollback: redeploy the previous commit/build (documented per host).

## Later increments
Add a serverless function (secrets, rate limits, cost caps) only in Increment 3. Add monitoring only with a clear purpose and privacy review. Error reporting must not capture presentation content.

## Production checklist (before any public launch)
HTTPS and security headers · CSP verified · dependency audit clean · license and attribution check of all content · accessibility check on the deployed build · browser matrix check · privacy statement matches actual behavior · name/domain/trademark check (Q7) · README presenting guide verified in a real Zoom/Meet/Teams share.
