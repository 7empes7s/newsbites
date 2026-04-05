# NewsBites Documentation

This folder consolidates the product intent from the master plan with the current implementation in `/opt/newsbites`.

## Documents

- [Master Plan Alignment](/opt/newsbites/docs/master-plan-alignment.md)
  Maps the original NewsBites requirements to the current state of the repository and infrastructure assumptions.

- [Architecture](/opt/newsbites/docs/architecture.md)
  Describes the app structure, route model, reader app surface, styling system, and content loading approach.

- [Content Workflow](/opt/newsbites/docs/content-workflow.md)
  Explains article frontmatter, publishing states, editorial flow, and current content lanes.

- [Deployment](/opt/newsbites/docs/deployment.md)
  Documents the runtime model, local deploy script, service assumptions, and operational gaps.

## Source Of Truth

Two sources were used to build these docs:

1. `/opt/mimoun/openclaw-config/workspace/MASTER_PLAN.md`
2. The live project files under `/opt/newsbites`

If the master plan and the repository diverge, treat the repo as the source of truth for current behavior and record the mismatch in the alignment document.
