---
name: resources
description: High-trust resources for learning Web Push, service workers, and software design
metadata:
  type: reference
---

# RESOURCES — Notification engine & architecture

## Web Push / notifications (high trust)

These are the canonical references for the Web Push pipeline. Ground each
lesson in at least one of these.

- **MDN — Push API**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
  The authoritative docs on `PushManager`, `PushSubscription`, permissions.
- **MDN — Notifications API**: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
  The browser Notification API (permission, `showNotification`).
- **MDN — Service Worker API**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  Background script lifecycle: install, activate, events, `clients`.
- **web.dev — Push notifications overview (Google)**: https://web.dev/articles/push-notifications-overview
  Clear end-to-end walkthrough of the whole chain, Google-flavoured.
- **web.dev — How Push Works**: https://web.dev/articles/push-notifications-how-push-works
  The "mailbox" model: subscription, applicationServerKey, delivery.
- **RFC 8292 (VAPID)**: https://datatracker.ietf.org/doc/html/rfc8292
  The actual spec for VAPID — voluntary application server identification.
  Heavy; only cite the concept, not the whole RFC.
- **IETF — Message Encryption for Web Push (RFC 8291)**: https://datatracker.ietf.org/doc/html/rfc8291
  How the payload is encrypted with the device's p256dh + auth keys. Heavy.

## Software design / architecture vocabulary

These back the architecture language (module, depth, seam, adapter):

- **John Ousterhout — A Philosophy of Software Design**: the source of
  "deep module" vs "shallow module" and "interface" thinking.
  (Book; link to author page: https://web.stanford.edu/~ouster/cgi-bin/home.php)
- **Michael Feathers — Working Effectively with Legacy Code**: the source of
  the "seam" concept (a place to alter behaviour without editing in that place).
- **Matt Pocock's codebase-design skill** (this repo's plugin): the glossary
  used in the architecture report — module, interface, depth, seam, adapter,
  leverage, locality.

## Projects / community (wisdom layer)

- **FCM docs (Google)** — if CUE ever uses Firebase Cloud Messaging:
  https://firebase.google.com/docs/cloud-messaging
- **Mozilla Autopush** — Firefox's push provider:
  https://autopush.readthedocs.io/
- **r/WebDev, r/reactjs** — general communities to test/sharpen understanding.

## Notes on the "does it even work on my laptop?" question

Desktop Chrome + `localhost` is notoriously unreliable for push:
- Push requires a service worker + secure context; `localhost` is treated as
  secure, but Chrome on desktop often suppresses or delays push from
  `http://localhost` for power/UX reasons.
- The reliable path is **HTTPS + a real device (mobile)** — exactly the deploy
  target. So the code may be correct while the laptop still shows nothing.
- See lesson `0001` and the diagnosis checklist for how to verify each link.
