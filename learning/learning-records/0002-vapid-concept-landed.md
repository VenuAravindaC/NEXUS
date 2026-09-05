---
name: 0002-vapid-concept-landed
description: Venu now understands VAPID — the wax seal (signing) + locked box (encryption) distinction, and why two key pairs are needed
metadata:
  type: learning-record
---

# 0002 — VAPID concept landed

## The insight

Venu now understands:
- The full push flow end-to-end (Lesson 0001 — mailbox analogy)
- VAPID = two jobs: **signing** (wax seal — proves identity to the provider)
  and **encryption** (locked box — so only the device can read the payload)
- Why two separate key pairs are needed: VAPID proves WHO sent it, p256dh
  proves WHO can read it. One key can't do both because they serve different
  trust domains (provider verification vs device privacy).

## How he learned it

The mailbox analogy extended: VAPID private key = wax seal on the envelope;
device's p256dh = lock on the box inside. The push provider checks the seal
but can't open the box. The device opens the box but didn't check the seal.

## Zone of proximal development (updated)

He has now completed:
1. ✅ Full push flow end-to-end
2. ✅ VAPID: signing + encryption, two keys = two jobs
3. ✅ Diagnosis checklist (he knows the 6 links in the chain)

Next in order:
4. Architecture vocabulary, grounded in his own code (module, seam, depth,
   adapter, leverage, locality) — the terms from the review report
5. Actually verify the notification works: deploy to Vercel + Render, enable
   on mobile, confirm the notification pops up
6. Explain the flow in an interview setting (practice explaining, not just
   understanding)

## How to teach (apply next lessons)

- The wax seal / locked box analogy worked well. Reuse it when explaining
  other crypto concepts (JWT signing, HTTPS certificates, etc.).
- He learns fast when the concept is grounded in HIS files + a physical
  analogy. Keep doing that.
- He's ready for architecture vocabulary now — but it must be grounded in
  his code, not abstract. The seamp / depth / leverage concepts should use
  the same PushSender interface as the example (he already felt the seam
  when the scheduler called the interface).
