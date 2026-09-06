package com.nexus.nexusbackend.controller;

import com.nexus.nexusbackend.model.Reminder;
import com.nexus.nexusbackend.security.ClerkJwtVerifier;
import com.nexus.nexusbackend.service.ReminderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The Controller — the "door" of the backend.
 *
 * Responsibilities:
 *   1. Listen on specific HTTP endpoints
 *   2. Read the incoming request (JSON body, URL params)
 *   3. Call the Service (the rulebook)
 *   4. Send back the right HTTP response + status code
 *
 * The Controller does NOT contain business logic — it just routes traffic.
 * Rules live in ReminderService.
 *
 * SECURITY: where does userId come from?
 *   It USED to ride along in the URL (?userId=...) or request body, which meant
 *   the client told us who they were. AuthFilter now verifies the Clerk JWT on
 *   every /api request and stashes the trusted user id on the request:
 *
 *     request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE)
 *
 *   The controller just reads it. "Who am I?" is answered by the verified token,
 *   never by anything the browser sends.
 *
 * @RestController = @Controller + @ResponseBody:
 *   every method return value is automatically serialized to JSON.
 * @RequestMapping("/api/reminders"):
 *   every endpoint in this class is prefixed with /api/reminders.
 */
@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    /**
     * GET /api/reminders
     *
     * Returns all reminders for the signed-in user.
     * The frontend calls this on page load to hydrate the notebook.
     */
    @GetMapping
    public ResponseEntity<List<Reminder>> getReminders(HttpServletRequest request) {
        String userId = (String) request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE);
        List<Reminder> reminders = reminderService.getRemindersForUser(userId);
        return ResponseEntity.ok(reminders); // 200 OK + the list as JSON
    }

    /**
     * POST /api/reminders
     *
     * Creates a new reminder.
     * The frontend sends the reminder data as JSON in the request body.
     *
     * Defense in depth: even if the body claims some OTHER userId, we overwrite
     * it with the verified one. The client never gets to decide who owns a row.
     * Returns 201 Created + the saved reminder (now with a real UUID from the DB).
     */
    @PostMapping
    public ResponseEntity<Reminder> createReminder(
            @RequestBody Reminder reminder,
            HttpServletRequest request) {

        reminder.setUserId((String) request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE));
        Reminder saved = reminderService.createReminder(reminder);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved); // 201 Created
    }

    /**
     * PUT /api/reminders/{id}
     *
     * Updates an existing reminder.
     * {id} is the UUID in the URL — e.g. PUT /api/reminders/550e8400-...
     *
     * @PathVariable extracts the {id} from the URL path.
     * Returns 200 OK if updated, 404 Not Found if the reminder doesn't exist
     * or doesn't belong to this user (the Service's ownership check).
     */
    @PutMapping("/{id}")
    public ResponseEntity<Reminder> updateReminder(
            @PathVariable UUID id,
            @RequestBody Reminder updates,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE);
        return reminderService.updateReminder(id, userId, updates)
                .map(ResponseEntity::ok)                        // found + updated → 200 OK
                .orElse(ResponseEntity.notFound().build());     // not found or wrong user → 404
    }

    /**
     * DELETE /api/reminders/{id}
     *
     * Deletes a reminder.
     * Returns 204 No Content if deleted (success with no body — standard for DELETE).
     * Returns 404 Not Found if the reminder doesn't exist or wrong user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(
            @PathVariable UUID id,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE);
        boolean deleted = reminderService.deleteReminder(id, userId);
        return deleted
                ? ResponseEntity.noContent().build()        // 204 No Content
                : ResponseEntity.notFound().build();        // 404 Not Found
    }
}