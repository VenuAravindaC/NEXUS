package com.nexus.nexusbackend.service;

import com.nexus.nexusbackend.model.Reminder;
import com.nexus.nexusbackend.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The Service layer — the rulebook for reminder operations.
 *
 * This is the ONLY place business logic lives. The Controller calls the Service;
 * the Service calls the Repository. The Controller never touches the DB directly.
 *
 * Why? Same reason we put the past-time guard in the frontend notebook, not in each page:
 * one place for the rules → no duplication → easy to change later.
 *
 * The fired lifecycle lives here:
 *   - fireDueReminders() sets fired = true (called by the scheduler)
 *   - updateReminder() re-arms fired = false on reschedule
 * One class owns the whole lifecycle → locality.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null") // Spring Data JPA's @NonNull annotations cause false positives with Eclipse null-analysis
public class ReminderService {

    /**
     * Hard cap per user. The frontend enforces the same number BEFORE calling
     * the API (so a normal user sees a friendly message instantly), but we
     * ALSO enforce it here — this is the real boundary, the one an attacker
     * (or a bypassed frontend) hits. If these two ever disagree, backend wins.
     * Keep in sync with MAX_REMINDERS in frontend src/store/reminders.jsx.
     */
    public static final int MAX_REMINDERS = 25;

    private final ReminderRepository reminderRepository;
    private final PushSender pushSender;

    /**
     * Get all reminders for a specific user.
     * The frontend filters from this full list (Dashboard/Upcoming/Calendar
     * each show different subsets — same pattern as before).
     */
    public List<Reminder> getRemindersForUser(String userId) {
        return reminderRepository.findByUserId(userId);
    }

    /**
     * Fire all due reminders: send push + mark fired.
     *
     * The scheduler calls this every 60 seconds. It owns the whole lifecycle:
     *   1. Find time reminders that are past due and haven't fired yet
     *   2. Send a push to each user's devices (via PushSender)
     *   3. Set fired = true so they don't fire again
     *
     * On reschedule (updateReminder), fired = false is re-armed — one class
     * owns both sides of the lifecycle.
     */
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

    /**
     * Create a new reminder.
     * The entity's @PrePersist hook sets createdAt automatically.
     * The database generates the UUID id automatically.
     *
     * Throws ReminderLimitExceededException if the user is already at the cap —
     * the controller turns that into a 409 Conflict.
     */
    public Reminder createReminder(Reminder reminder) {
        long count = reminderRepository.countByUserId(reminder.getUserId());
        if (count >= MAX_REMINDERS) {
            throw new ReminderLimitExceededException(MAX_REMINDERS);
        }
        return reminderRepository.save(reminder);
    }

    /**
     * Update an existing reminder.
     * We first verify it exists AND belongs to this user — security check.
     * If not found or wrong user: return empty (Controller will send 404).
     */
    public Optional<Reminder> updateReminder(UUID id, String userId, Reminder updates) {
        return reminderRepository.findById(id)
                .filter(existing -> existing.getUserId().equals(userId)) // ownership check
                .map(existing -> {
                    // Apply only the fields that can change after creation
                    existing.setTitle(updates.getTitle());
                    existing.setType(updates.getType());
                    existing.setRemindAt(updates.getRemindAt());
                    existing.setLatitude(updates.getLatitude());
                    existing.setLongitude(updates.getLongitude());
                    existing.setLocationName(updates.getLocationName());
                    existing.setRadius(updates.getRadius());
                    existing.setDone(updates.isDone());

                    // Re-arm: if the user rescheduled this to a FUTURE time,
                    // clear the fired flag so the scheduler notifies again.
                    // (If remindAt became null, switching to a location reminder,
                    // we leave fired as-is — the geofence system is separate.)
                    if (updates.getRemindAt() != null && updates.getRemindAt().isAfter(Instant.now())) {
                        existing.setFired(false);
                    }
                    return reminderRepository.save(existing);
                });
    }

    /**
     * Delete a reminder.
     * Same ownership check — a user can only delete their OWN reminders.
     * Returns true if deleted, false if not found or wrong user.
     */
    public boolean deleteReminder(UUID id, String userId) {
        return reminderRepository.findById(id)
                .filter(existing -> existing.getUserId().equals(userId)) // ownership check
                .map(existing -> {
                    reminderRepository.delete(existing);
                    return true;
                })
                .orElse(false);
    }
}
