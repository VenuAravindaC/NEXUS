---
name: 0001-notification-flow-blackbox
description: Venu built the notification system but never learned the flow — it's a black box he can't explain or debug
metadata:
  type: learning-record
---

# 0001 — The notification engine is a black box

## The insight

Venu understands the standard backend layering (controller → service →
repository → database) and frontend state well. But the **push notification
pipeline is a black box to him**: he helped build it (scheduler, WebPushSender,
VAPID, service worker) without ever learning how the pieces connect.

Two consequences:
1. He can't explain it in an interview.
2. He can't diagnose "is it even working?" — nothing fires on his laptop,
   and he doesn't know which link in the chain to suspect.

## What drove this

- He built the notification feature on autopilot (with AI help) as part of
  the CUE app.
- He has never traced the full journey: create reminder → scheduler tick →
  push send → provider → service worker → system notification.
- The architecture review report used vocabulary (module, seam, depth) that
  meant nothing to him — showing that the *concepts* are the gap, not just
  the notification specifics.

## Zone of proximal development

He is ready to learn, in order:
1. The full push flow end-to-end (this is the priority — Lesson 0001).
2. The "mailbox" model of push: subscription = a key to a mailbox; the
   backend posts a letter; the provider holds the mailbox; the service
   worker is the mailbox owner's agent that wakes up.
3. The architecture vocabulary, grounded in his own code (after the flow lands).
4. The diagnosis checklist: which link breaks → what symptom.

## How to teach (apply next lessons)

- Always ground in his actual files (`push.js`, `sw.js`, `ReminderScheduler`,
  `WebPushSender`, `PushSubscriptionController`, `VapidConfig`).
- Use the mailbox/letter/address analogy throughout — it maps 1:1.
- Plain English first; introduce the term only after the concept is felt.
- End with a real diagnostic task (check the logs, trace a due reminder) so
  he answers "is it even working?" himself.
