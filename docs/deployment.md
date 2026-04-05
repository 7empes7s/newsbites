# Deployment

## Current Deployment Model

The master plan allows for either static export or a live Node runtime, with a preference for static export first if the site remains content-first. The repository is currently deployed as a live Next.js runtime.

Evidence in this repo:

- [package.json](/opt/newsbites/package.json) uses `next build` and `next start`
- [deploy.sh](/opt/newsbites/deploy.sh) builds the app and restarts `newsbites.service`

## Expected Runtime Topology

From the master plan and existing repo assumptions:

- App directory: `/opt/newsbites`
- App port: `127.0.0.1:3001`
- Public hostname: `news.techinsiderbytes.com`
- Reverse proxy: Caddy
- Git remote: `https://github.com/7empes7s/newsbites.git`

The master plan also notes a Cloudflare DNS record for `news.techinsiderbytes.com`.

## Current Deployment Script

[deploy.sh](/opt/newsbites/deploy.sh)

Current behavior:

1. Changes into `/opt/newsbites`
2. Runs `npm install`
3. Runs `npm run build`
4. Restarts `newsbites.service`

This is workable for a single-host deployment, but it is still a thin wrapper rather than a full deployment contract.

## Operational Assumptions

This repository assumes, but does not define, the following external resources:

- A `systemd` unit named `newsbites.service`
- A Caddy route proxying the hostname to port `3001`
- DNS already pointing `news.techinsiderbytes.com` to the target server
- Sufficient Node.js and npm availability on the host

## Known Gaps

- No `systemd` unit file is stored in this repository
- No Caddyfile fragment is stored in this repository
- No environment setup instructions are documented here
- No CI workflow exists for build verification or remote deployment
- `npm install` on every deploy is simple but slower and less deterministic than `npm ci`

## Recommended Deployment Contract

For the next iteration, keep deployment simple and explicit:

1. Store the `newsbites.service` unit in version control.
2. Store the Caddy route snippet in version control.
3. Switch `deploy.sh` to `npm ci` when the lockfile is the source of truth.
4. Add a build verification step before restart.
5. Document rollback steps.

## Minimal Manual Deploy Flow

```bash
cd /opt/newsbites
git pull origin main
npm install
npm run build
systemctl restart newsbites.service
```

## Verification Checklist

After deployment, verify:

- `npm run build` succeeds
- the service is running
- the app responds on `127.0.0.1:3001`
- Caddy serves `news.techinsiderbytes.com`
- the latest approved article is reachable from the homepage
