package com.nexus.nexusbackend.service;

/**
 * Thrown by ReminderService when a user tries to create more reminders
 * than MAX_REMINDERS allows.
 *
 * It's a simple carrier: it holds the limit number so whoever catches it
 * (the GlobalExceptionHandler) can build a helpful error message.
 */
public class ReminderLimitExceededException extends RuntimeException {

    private final int limit;

    public ReminderLimitExceededException(int limit) {
        super("Reminder limit of " + limit + " reached");
        this.limit = limit;
    }

    public int getLimit() {
        return limit;
    }
}
