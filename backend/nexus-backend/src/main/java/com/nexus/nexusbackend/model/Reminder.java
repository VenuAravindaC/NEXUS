package com.nexus.nexusbackend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

/**
 * The Reminder entity — one row in the "reminders" table in Neon PostgreSQL.
 * JPA reads this class and creates/updates the table schema automatically
 * (because spring.jpa.hibernate.ddl-auto=update in application.properties).
 *
 * Lombok annotations remove boilerplate:
 *   @Data           → generates getters, setters, equals, hashCode, toString
 *   @NoArgsConstructor → generates an empty constructor (required by JPA)
 *   @AllArgsConstructor → generates a constructor with all fields
 *   @Builder        → lets us do Reminder.builder().title("...").build()
 */
@Entity
@Table(name = "reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {

    /**
     * Primary key — the database generates a UUID automatically on INSERT.
     * UUID = Universally Unique Identifier (e.g. "550e8400-e29b-41d4-a716-446655440000")
     * No two rows will ever share an id, even across multiple servers.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * Clerk user id — every reminder belongs to exactly one user.
     * nullable = false means this column CANNOT be empty (enforced at DB level).
     */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /**
     * The reminder title — e.g. "Call dentist".
     */
    @Column(nullable = false)
    private String title;

    /**
     * "time" or "location" — matches the frontend's reminderType.
     */
    @Column(nullable = false)
    private String type;

    /**
     * When to fire this reminder (time-based only).
     * Null for location-based reminders.
     * Instant = a UTC timestamp — timezone-safe (matches our frontend's .toISOString()).
     */
    @Column(name = "remind_at")
    private Instant remindAt;

    // --- Location fields (null for time-based reminders) ---

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    /**
     * Radius in meters — how close the user must be to trigger the reminder.
     * Default 250m, matches the frontend default.
     */
    @Column
    @Builder.Default
    private Integer radius = 250;

    /**
     * Has the user marked this reminder as done?
     * "is_done" in the DB column; false by default.
     *
     * @JsonProperty forces Jackson to serialize this as "isDone" in JSON.
     * Without it, Lombok's boolean getter isDone() makes Jackson serialize it as "done"
     * (it strips the "is" prefix) — which breaks the frontend expecting "isDone".
     */
    @Column(name = "is_done", nullable = false)
    @Builder.Default
    @JsonProperty("isDone")
    private boolean isDone = false;

    /**
     * Has the scheduler already fired this reminder?
     * The scheduler runs every 60s and asks "which reminders are due?"
     * This flag stops it from re-sending the same reminder each minute.
     *
     * false -> not fired yet (the scheduler should pick it up)
     * true  -> already notified (leave it alone)
     *
     * When the user edits a reminder and reschedules it to a FUTURE time,
     * ReminderService clears this back to false ("re-arm") so it fires again.
     * Jackson serializes this as "fired" automatically (plain boolean field name).
     */
    @Column(name = "fired", nullable = false)
    @Builder.Default
    private boolean fired = false;

    /**
     * When was this reminder created?
     * Set once on creation — never updated (updatable = false).
     * Instant = UTC timestamp.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Set createdAt automatically before the first INSERT.
     * @PrePersist runs just before JPA saves a new entity to the DB.
     * This means we never forget to set createdAt — JPA handles it.
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
