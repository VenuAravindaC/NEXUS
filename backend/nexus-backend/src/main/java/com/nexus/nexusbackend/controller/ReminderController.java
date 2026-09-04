package com.nexus.nexusbackend.controller;

import com.nexus.nexusbackend.model.Reminder;
import com.nexus.nexusbackend.service.ReminderService;
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
 * @RestController = @Controller + @ResponseBody:
 *   every method return value is automatically serialized to JSON.
 * @RequestMapping("/api/reminders"):
 *   every endpoint in this class is prefixed with /api/reminders.
 * @CrossOrigin:
 *   allows the frontend (running on a different origin like localhost:5173
 *   or your Vercel URL) to call this backend. Without this, browsers block
 *   the request (CORS policy). We'll tighten this to specific origins in production.
 */
@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // TODO: tighten to specific Vercel URL before production
public class ReminderController {

    private final ReminderService reminderService;

    /**
     * GET /api/reminders?userId=abc123
     *
     * Returns all reminders for a user.
     * The frontend calls this on page load to hydrate the notebook.
     *
     * @RequestParam extracts ?userId=... from the URL query string.
     * ResponseEntity<List<Reminder>> = HTTP response wrapper (lets us set status codes).
     */
    @GetMapping
    public ResponseEntity<List<Reminder>> getReminders(@RequestParam String userId) {
        List<Reminder> reminders = reminderService.getRemindersForUser(userId);
        return ResponseEntity.ok(reminders); // 200 OK + the list as JSON
    }

    /**
     * POST /api/reminders
     *
     * Creates a new reminder.
     * The frontend sends the reminder data as JSON in the request body.
     *
     * @RequestBody reads the JSON body and converts it to a Reminder object.
     * Returns 201 Created + the saved reminder (now with a real UUID from the DB).
     */
    @PostMapping
    public ResponseEntity<Reminder> createReminder(@RequestBody Reminder reminder) {
        Reminder saved = reminderService.createReminder(reminder);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved); // 201 Created
    }

    /**
     * PUT /api/reminders/{id}?userId=abc123
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
            @RequestParam String userId,
            @RequestBody Reminder updates) {

        return reminderService.updateReminder(id, userId, updates)
                .map(ResponseEntity::ok)                        // found + updated → 200 OK
                .orElse(ResponseEntity.notFound().build());     // not found or wrong user → 404
    }

    /**
     * DELETE /api/reminders/{id}?userId=abc123
     *
     * Deletes a reminder.
     * Returns 204 No Content if deleted (success with no body — standard for DELETE).
     * Returns 404 Not Found if the reminder doesn't exist or wrong user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(
            @PathVariable UUID id,
            @RequestParam String userId) {

        boolean deleted = reminderService.deleteReminder(id, userId);
        return deleted
                ? ResponseEntity.noContent().build()        // 204 No Content
                : ResponseEntity.notFound().build();        // 404 Not Found
    }
}
