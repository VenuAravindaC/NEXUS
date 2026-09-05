package com.nexus.nexusbackend.exception;

import com.nexus.nexusbackend.service.ReminderLimitExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Global exception handler — the app's single "error door."
 *
 * Normally, when a Controller method throws, Spring returns a generic
 * 500 Internal Server Error. That's unhelpful to the frontend: it can't
 * tell "you broke the server" apart from "you did something the rules
 * forbid." This class lets us turn specific exceptions into specific,
 * meaningful HTTP status codes with a readable message.
 *
 * @RestControllerAdvice = "watch ALL controllers; if one of these
 * exceptions escapes, run my handler instead of the default."
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * When a user hits their reminder cap, the Service throws
     * ReminderLimitExceededException. We answer with:
     *   409 Conflict  — "you're asking to do something the current state
     *                   of your account doesn't allow"
     *   body: { "error": "Reminder limit of 25 reached" }
     *
     * The frontend's addReminder checks !res.ok and shows a friendly message.
     */
    @ExceptionHandler(ReminderLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleLimitExceeded(ReminderLimitExceededException e) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT) // 409
                .body(Map.of("error", e.getMessage()));
    }
}
