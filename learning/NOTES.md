# NOTES — teaching preferences & working notes

## How Venu wants to be taught (from memory `nexus-teaching-style`)

- **Step-by-step**, never a wall of text.
- **Analogies** that map to something he already knows (mailbox, letter,
  lockbox, etc.).
- **Checkpoints**: stop and confirm he's with me before moving on.
- **Grill**: ask questions to check real understanding, not just "did that make sense".
- **Learn by building**: end each lesson with a task he does, not just reading.
- **Plain English first, jargon second.** Never lead with vocabulary.
- **He built CUE** — always teach using *his actual files*, not generic examples.
- Small, fast wins. One lesson = one "aha".

## Working notes (this session)

- Venu's real gap: **the notification engine is a black box.** He understands
  frontend well and backend layering (controller → service → repo → db), but
  not the push pipeline. He also doesn't know *if it works* — nothing fires
  on his laptop (likely: desktop Chrome + localhost is unreliable for push;
  real target is HTTPS + mobile after deploy).
- He got lost in the architecture review HTML because I threw jargon at him
  without teaching the vocabulary first. Lesson learned (for me): teach
  concepts before terms, grounded in his code.
- Teaching workspace lives under `learning/` (not in git-tracked app source).
