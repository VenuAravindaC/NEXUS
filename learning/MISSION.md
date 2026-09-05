---
name: teaching-workspace
description: Teaching workspace for Venu to learn CUE's notification engine + architecture
metadata:
  type: project
---

# MISSION — Learn the notification engine (and CUE's architecture) deeply

## Why Venu is learning this

Venu is self-teaching full-stack development by building **CUE**, a smart
reminder app, for software-engineering interviews. He has learned:

- Frontend well (React, state, components, Clerk auth)
- Backend layering (controller → service → repository → database)
- REST + JSON, API calls, how frontend and backend talk

**But he built the notification system without learning it.** He wrote
`scheduler → push sender → VAPID → service worker` on autopilot (with help),
and now:
1. He can't explain the flow in an interview
2. He doesn't know *if it even works* — nothing fires on his laptop
3. The architecture vocabulary (module, seam, depth) in the review report
   meant nothing to him

## The concrete goal

By the end of this teaching track, Venu should be able to:

1. **Trace the whole push flow end-to-end** — from "user creates a reminder"
   to "system notification appears" — naming each hop and the file responsible.
2. **Diagnose why a push doesn't arrive** (the "is it even working?" question):
   know the checklist of links in the chain and which one breaks.
3. **Speak the architecture vocabulary** fluently (module, interface, depth,
   seam, adapter, leverage, locality) — grounded in *his own* code.
4. **Answer interview questions** about Web Push, VAPID, service workers, and
   the scheduler with confidence and real examples from his own project.

## Teaching principles (from memory + preference)

- Teach the real thing he built, not generic examples. Read the actual files.
- Plain English first, vocabulary second. Jargon only after the concept lands.
- Step-by-step, analogies, checkpoints. Grill to confirm understanding.
- Small, fast wins. One lesson = one tangible "aha" he can use.
- He learns by building — end lessons with a task, not just reading.

## Scope guard

- This is a learning workspace. Keep it under `learning/` — do NOT commit
  teaching files into the app's git-tracked source.
- Do not modify: `.env.local`, `application.properties`, `CLAUDE.md`,
  `INTERVIEW_NOTES.md`, gitignored VAPID keys.
