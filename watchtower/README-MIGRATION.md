# Watch Tower / Global Sky migration staging

This folder stages the migration of watchtower.barbph.com from a manual Netlify Drop to a code-based deployment with Netlify Functions, scheduled camera scouting, and persistent registry support. The live Watch Tower site has not been modified by this commit.

Verified live Netlify site:
- Site: watchtower.barbph.com
- Netlify project: thriving-pie-e168bd
- Site ID: 43e2c463-4305-4f10-9e2d-6a31ea627c79
- Current production deploy source: Netlify Drop
- Current production deploy contains index.html and global-sky.html only
- Current production deploy has no Netlify Functions or Edge Functions

Migration rule: preserve the existing public design and camera inventory while adding backend camera registry/health/scout functionality. Do not repoint the production domain until the code deployment is verified.
