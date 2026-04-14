@AGENTS.md

## Local coding agent

Use `local-code` for code edits in this repo. It runs aider in architect mode using local GPU models:
- Architect: `qwen3:32b-q4_K_M` (planning)
- Editor: `qwen2.5-coder:32b-instruct-q4_K_M` (diffs)

```bash
local-code [files...]                          # interactive
local-code --message "what to do" [files...]   # non-interactive
```

After edits, always run `npm run build` to verify.
