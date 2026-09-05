package com.nexus.nexusbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * The Scheduler — the background clock that ticks every 60 seconds.
 *
 * This class is a shallow trigger. It has no behaviour of its own —
 * it simply tells the rulebook (ReminderService) to check for due reminders.
 *
 * Why the rulebook lives elsewhere (ReminderService)?
 *   - ReminderService owns the ENTIRE fired lifecycle:
 *     fireDueReminders() sets fired = true
 *     updateReminder() re-arms fired = false on reschedule
 *   - If the scheduler owned the firing logic, two classes would own the
 *     fired rule → broken locality (fix in one place, miss the other).
 *   - The scheduler is a clock, not a rulebook.
 *
 * @Scheduled is Spring's cron/timer annotation. When @EnableScheduling is
 * on the app class, Spring runs this method on a fixed schedule. The
 * thread pool is Spring's default "scheduling" pool (one thread, daemon).
 * Since our work is a DB query + network IO (push), this is plenty.
 *
 * This class does NOT know about PushSender, WebPushSender, or the
 * ReminderRepository — it only knows ReminderService. We could swap
 * implementations without touching this file.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderService reminderService;

    /**
     * Tick — the clock fires, the rulebook decides what to do.
     */
    @Scheduled(fixedRate = 60_000)
    public void fireDueReminders() {
        reminderService.fireDueReminders();
    }
}