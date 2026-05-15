---
description: Machine-user identity for safe-output jobs — comments and pushes appear as the kibana-agent user.
safe-outputs:
  github-token: ${{ secrets.MACHINE_USER_PAT }}
---

## Safe outputs — machine-user identity

Safe-output jobs authenticate with a classic PAT from the **kibana-agent** machine user account. Comments, PR creation, and branch pushes appear as **`kibana-agent`**.
