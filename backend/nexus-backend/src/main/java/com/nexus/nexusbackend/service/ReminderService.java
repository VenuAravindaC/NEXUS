package com.nexus.nexusbackend.service;

import com.nexus.nexusbackend.model.Reminder;
import com.nexus.nexusbackend.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null") // Spring Data JPA's @NonNull annotations cause false positives with Eclipse null-analysis
public class ReminderService {

    private final ReminderRepository reminderRepository;

    /**
     * Get all reminders for a specific user.
     * The frontend filters from this full list (Dashboard/Upcoming/Calendar
     * each show different subsets — same pattern as before).
     */
    public List<Reminder> getRemindersForUser(String userId) {
        return reminderRepository.findByUserId(userId);
    }

    /**
     * Create a new reminder.
     * The entity's @PrePersist hook sets createdAt automatically.
     * The database generates the UUID id automatically.
     */
    public Reminder createReminder(Reminder reminder) {
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
