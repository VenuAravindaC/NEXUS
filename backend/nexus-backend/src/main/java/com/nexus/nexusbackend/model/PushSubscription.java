package com.nexus.nexusbackend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * The PushSubscription entity — one row in the "push_subscriptions" table in Neon PostgreSQL.
 *
 * Think of a push subscription as a MAILBOX KEY that a device hands us:
 * "If you post a letter to this address, the browser will wake up and show
 * a notification." Each device gets its own mailbox key (endpoint + keys).
 *
 * We store it so that when a reminder fires, we know WHERE to deliver the message.
 * The endpoint URL points at the push provider (Mozilla/Google/Apple);
 * p256dh + auth are the encryption keys needed to encrypt the payload so only
 * that device can read it.
 *
 * JPA reads this class and creates the table automatically
 * (spring.jpa.hibernate.ddl-auto=update).
 */
@Entity
@Table(name = "push_subscriptions", indexes = {
        @Index(name = "idx_pushsub_user", columnList = "user_id"),
        @Index(name = "idx_pushsub_endpoint", columnList = "endpoint")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {

    /**
     * Primary key — the database generates a UUID automatically on INSERT.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * Clerk user id — every subscription belongs to exactly one user.
     * Indexed (see @Table above) because the scheduler queries by this.
     */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /**
     * The mailbox address — a long URL like
     * "https://fcm.googleapis.com/fcm/send/xyz...".
     * Unique: if the same device subscribes twice, we upsert instead of
     * creating a duplicate row. Length 2048 because some provider URLs are long.
     */
    @Column(nullable = false, unique = true, length = 2048)
    private String endpoint;

    /**
     * The public encryption key of this device (base64url).
     * Used to encrypt each push payload so only this device can read it
     * (Web Push uses Elliptic-Curve Diffie-Hellman).
     */
    @Column(nullable = false)
    private String p256dh;

    /**
     * A shared secret (base64url) used together with p256dh to derive
     * the message encryption key.
     */
    @Column(nullable = false)
    private String auth;

    /**
     * When was this subscription registered?
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Set createdAt automatically before the first INSERT.
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}