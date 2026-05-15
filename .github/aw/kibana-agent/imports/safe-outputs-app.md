---
description: GitHub App identity for safe-output jobs — comments and pushes appear as kibana-agent[bot].
safe-outputs:
  github-app:
    client-id: ${{ vars.APP_ID }}
    private-key: ${{ secrets.APP_PRIVATE_KEY }}
---

## Safe outputs — App identity

Safe-output jobs use the **kibana-agent** GitHub App to mint short-lived installation tokens. Comments, PR creation, and branch pushes appear as **`kibana-agent[bot]`**.
