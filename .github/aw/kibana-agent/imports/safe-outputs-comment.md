---
description: Shared fragment — safe outputs for issue/PR comments.
---

## Safe outputs — comments

- Use configured `add-comment` safe outputs with limits from the workflow frontmatter.
- Workflows using `target: "triggering"` automatically resolve the target issue or PR from the event context — no `item_number` needed.
- Workflows using `target: "*"` (e.g. those triggered by `workflow_dispatch` or `workflow_run`) require an explicit `item_number` in every `add_comment` call, set to the target issue or PR number.
- One concise thread update per activation unless the workflow allows more.
