---
description: Deploy to the server (build, vhost, cert, reload)
---
Verify `.env.deploy` is filled (APP_NAME, DOMAIN, PORT), then run `./scripts/deploy`.
Report the live URL when done.

If the cert step fails, the usual cause is DNS: confirm DOMAIN's A record points
at the deploy box's IP and has propagated before retrying.
