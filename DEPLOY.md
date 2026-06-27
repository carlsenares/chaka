# DEPLOY.md — hosting

> **Server-default. No Vercel.** We host on the box you own, behind the shared
> `insureai_nginx` gateway, additively (existing ares vhosts are never touched).
> Never demo on localhost.

## How it works on this box
- One nginx container (`insureai_nginx`) fronts every domain. Vhosts live at
  `/root/insureai/InsureAI/backend/nginx/conf.d/` — one `.conf` per domain.
- Apps publish on a host port; nginx proxies via the bridge gateway
  `http://172.18.0.1:<PORT>`.
- TLS via the `insureai_certbot` container (HTTP-01), certs in
  `/etc/letsencrypt/live/<domain>/`.

## Config (set per project)
Copy `.env.example` → `.env.deploy` and set:
```
APP_NAME=myapp           # container + vhost name
DOMAIN=myapp.com         # or app.<server-ip>.sslip.io for an instant URL
PORT=5190                # unique host port for this app
```

## Deploy
```bash
./scripts/deploy          # build container, write vhost, issue cert, reload nginx
```
The script is idempotent and additive. It:
1. builds & starts the app container (publishes 127.0.0.1:$PORT)
2. installs an HTTP-only vhost so certbot can solve the challenge
3. issues the cert (skips if it already exists)
4. swaps in the full HTTPS vhost and reloads nginx

## Teardown
```bash
./scripts/undeploy            # stop container, remove vhost, reload nginx
./scripts/undeploy --rm-cert  # …and delete the cert too
```
Additive-safe — only touches this app's container + vhost; ares vhosts untouched.

## Domains — per-product, for the professional aura
- **Before the name is set:** use `app.<server-ip>.sslip.io` — instant, zero
  registration, real working URL. Your fallback.
- **Once the product name locks (day 1):** register the matching domain, point an
  A record at this box, set `DOMAIN`, redeploy. Demo on the pretty domain.
- Register **early** (day 1, not hour 23) so DNS + cert settle in time.

## Team collaboration without server access
Teammates only touch GitHub — never the box. Flow: branch → PR (CodeRabbit
reviews) → merge to `main` → `.github/workflows/deploy.yml` SSHes in and runs
`./scripts/deploy`. The team gets push-to-live; you keep sole server access.

### One-time, on the box (reused for every hackathon)
Create a dedicated CI SSH key (revocable, used only by Actions):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/ci_deploy -N "" -C "github-actions-deploy"
cat ~/.ssh/ci_deploy.pub >> ~/.ssh/authorized_keys
```

### Per hackathon repo (~2 min)
```bash
# 1. clone the spawned repo onto the box where it'll be hosted
gh repo clone <you>/<project> /root/deploys/<project>

# 2. set all 4 deploy secrets in one command
./scripts/init-deploy <you>/<project>

# 3. fill .env.deploy, push to main → it deploys
```
`init-deploy` reads the box-specific values (SSH_HOST/USER/KEY) from your env or a
gitignored local file, and derives DEPLOY_DIR from the repo name. Keeping the box
address out of git means any repo made from this template is safe to make public.
One-time, on your machine:
```bash
mkdir -p ~/.config/ares && cat > ~/.config/ares/deploy.env <<'EOF'
SSH_HOST=1.2.3.4            # the deploy box IP/host
SSH_USER=root
SSH_KEY_FILE=~/.ssh/ci_deploy
EOF
```
Or pass inline: `SSH_HOST=1.2.3.4 ./scripts/init-deploy you/project`. Custom dir as $2.
Note: deploy runs as `root` because the nginx vhost dir lives under `/root/`.
The CI key is dedicated and revocable (`sed -i '/ci_deploy/d' ~/.ssh/authorized_keys`).
