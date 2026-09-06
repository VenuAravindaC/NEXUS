# CONTEXT.md — CUE domain glossary

Names the concepts the code works with, so architecture conversations have
shared vocabulary. Terms only make it here when they earn it: they name a real
seam, or they reappear across modules and someone had to unify them.

## CUE
The product: a smart reminder app. Time-based reminders are fired by a backend
scheduler and delivered as Web Push; location-based reminders are fired
client-side by a geofence watcher.

## Reminder
A single thing the user wants to be told about. Carries a **race**: either
`time` (has a `remindAt`) or `location` (has latitude/longitude/radius). Owned
by exactly one user (see **User identity**). Cap of 25 per user.

## Fire & re-arm
A **time** reminder's lifecycle. Once `remindAt` passes, the scheduler marks it
`fired` and sends the push. Editing it to a future time **re-arms** it
(`fired` clears). `fired` is meaningless for location reminders — those fire
client-side.

## User identity
The Clerk JWT `sub` claim — a String, not a row in any `users` table. It enters
the backend through `AuthFilter` (verified token → request attribute) and every
module downstream treats it as "who the request is as." Ownership of reminders
and push subscriptions is enforced by comparing against this identity.

## PushSender
The interface the reminder module calls to deliver a notification
(`send(userId, title, body, route)`). **WebPushSender** is its VAPID adapter.
The reminder module never sees the web-push library.

## Push subscription
A device's "mailbox address" registered with the push provider: endpoint +
p256dh + auth keys. Created in the browser, stored per-user in Postgres, and
consumed by WebPushSender for encrypted delivery. Dead when the provider
answers `410 Gone`.

## Geofence alert
The client-side equivalent of "a reminder fired": the location watcher detects
entry into a reminder's radius and emits an in-app `geofence-alert` event (and,
when permitted, a system notification). This is delivery path B; Web Push is
delivery path A.

## Banner
The in-app toast (`NotificationBanner`) that surfaces both delivery paths while
the app is open. It is the one place the two asymmetric paths meet.

## Skeleton
The loading-state placeholder cards shown while reminders hydrate. Shared shape
now lives in one component.