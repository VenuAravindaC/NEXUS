package com.nexus.nexusbackend.repository;

import com.nexus.nexusbackend.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The Repository — the ONLY layer that talks to the database.
 *
 * By extending JpaRepository<PushSubscription, UUID> we get all basic
 * operations for free (same as ReminderRepository). We add three derived queries:
 *
 *   findByUserId(userId)   → SELECT * FROM push_subscriptions WHERE user_id = ?
 *                            (used by the scheduler to find a user's device mailboxes)
 *   findByEndpoint(endpoint) → SELECT * ... WHERE endpoint = ?
 *                            (used for the upsert check — same device re-subscribing)
 *   deleteByEndpoint(endpoint) → DELETE ... WHERE endpoint = ?
 */
@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    /**
     * All subscriptions registered by a given user.
     * The scheduler delivers a notification to EVERY device in this list.
     */
    List<PushSubscription> findByUserId(String userId);

    /**
     * Find the stored subscription for a specific endpoint URL.
     * Used to decide "is this a new device, or the same one re-subscribing?"
     */
    Optional<PushSubscription> findByEndpoint(String endpoint);

    /**
     * Remove a subscription by its endpoint.
     * Used to clean up a stale mailbox (the push provider answered 410 Gone).
     */
    void deleteByEndpoint(String endpoint);
}