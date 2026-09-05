package com.nexus.nexusbackend.service;

import com.nexus.nexusbackend.model.Reminder;
import com.nexus.nexusbackend.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * The Scheduler — the background worker that watches for due reminders.
 *
 * Every 60 seconds (@Scheduled(fixedRate = 60_000)), this method runs:
 *   1. Ask the DB: "which time reminders are past due and haven't fired yet?"
 *   2. For each one: send a push notification to the user's devices.
 *   3. Flip the fired flag to true so it doesn't fire again.
 *
 * Why a backend scheduler (not frontend polling)?
 *   - Runs even if the user's browser is closed (for time reminders).
 *   - One source of truth — not two tabs firing the same reminder twice.
 *   - Simple to understand: a 60-second timer, a DB query, a loop.
 *
 * @Scheduled is Spring's cron/timer annotation. When @EnableScheduling is
 * on the app class, Spring runs this method on a fixed schedule. The
 * thread pool is Spring's default "scheduling" pool (one thread, daemon).
 * Since our work is a DB query + network IO (push), this is plenty.
 *
 * This class does NOT know about WebPushSender — it only uses PushSender
 * (the interface). We could swap implementations without touching this file.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final PushSender pushSender;

    /**
     * Query the DB for due reminders and fire them.
     *
     * findDueReminders(now) returns:
     *   - type = 'time'          (only time reminders; location reminders are handled in-app)
     *   - remindAt <= now         (the moment has arrived)
     *   - fired = false           (we haven't notified yet)
     *
     * After sending, we set fired = true and save. On the next tick (60s later),
     * the same reminder won't appear in the query again.
     */
    @Scheduled(fixedRate = 60_000)
    public void fireDueReminders() {
        Instant now = Instant.now();
        List<Reminder> due = reminderRepository.findDueReminders(now);
        if (due.isEmpty()) return;

        log.info("Firing {} due reminder(s)", due.size());
        for (Reminder r : due) {
            pushSender.send(r.getUserId(), "NEXUS Reminder", r.getTitle(), "/dashboard");
            r.setFired(true);
            reminderRepository.save(r);
        }
    }
}