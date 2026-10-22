# Deploy AgentsLaTeX

## GitHub App

Register a public GitHub App (installable by any account), with:

- Repository Contents: read/write; Metadata: read.
- Account Repository creation: read/write. No repository Administration permission.
- Callback: https://agentlatex.com/api/auth/callback.
- Local development callback: http://127.0.0.1:4391/api/auth/callback.
- Setup URL: https://agentlatex.com/?connected=1.
- Expiring user tokens enabled; OAuth during installation disabled; webhooks disabled.

The app uses the confidential OAuth web flow with single-use state. Users authorize
identity and install on selected repositories. User access tokens are restricted by
both user and app access. Installation tokens are not used. A GitHub CLI login cannot
register this app or substitute for a website user's authorization.

If a manifest submission goes through GitHub sign-in first, GitHub can lose the POST
body and report “We didn't find an App Manifest.” Return to the original setup form
and submit it again after signing in. Do not create an empty manual app instead.

Set public GITHUB_CLIENT_ID and GITHUB_APP_SLUG in wrangler.jsonc. Store secrets in
ignored `.dev.vars` locally and Wrangler secrets remotely:

- GITHUB_CLIENT_SECRET: the GitHub App client secret.
- SESSION_KEY: 32 cryptographically random bytes encoded as base64.
- APP_ORIGIN=http://127.0.0.1:4391 in .dev.vars only for local development.

Never print/commit tokens, private keys, secret files or database exports. Changing the
session encryption key invalidates existing sessions; users must reconnect.

## Cloudflare

Use a dedicated D1 database `agentslatex` and R2 bucket `agentslatex-compiler`.
Enable R2 in the account dashboard first; review any billing activation there. Use the
Free domain plan unless a concrete requirement warrants another plan. R2 storage and
operations have metered allowances; browser compilation itself uses no Worker CPU.

```sh
pnpm exec wrangler d1 execute agentslatex --remote --file worker/schema.sql
pnpm exec wrangler r2 bucket create agentslatex-compiler
node scripts/upload-compiler.mjs --remote
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put SESSION_KEY
pnpm build:hosted
pnpm exec wrangler deploy
```

The upload script uses the existing, pinned local compiler assets. It gzip-compresses
them and records Content-Encoding; the Worker passes those bytes through without
recompressing. The largest object transfers about 250 MiB instead of 326 MiB. Local
and remote uploads use the same keys. The initial package download remains substantial.

Add agentlatex.com to Cloudflare, preserve existing DNS records, update its Namecheap
nameservers to those Cloudflare assigns, and attach the Worker custom domain. Verify
DNS and HTTPS before making it the live OAuth destination. Keep other domains/apps
unchanged. No secret belongs in a DNS record or public client environment variable.

Run the real Connect → create private project → save → compile → reopen journey,
then a collaborator change/conflict check. A successful deploy is not that evidence.
The deployed application includes its source archive; private runtime data is excluded.
