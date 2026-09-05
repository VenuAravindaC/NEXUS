package com.nexus.nexusbackend.service;

import com.nexus.nexusbackend.model.PushSubscription;
import com.nexus.nexusbackend.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * The Service layer — the rulebook for push subscriptions.
 *
 * Same layering as ReminderService: Controller routes traffic, Service holds
 * the rules, Repository talks to the DB.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null") // Spring Data JPA's @NonNull annotations cause false positives with Eclipse null-analysis
public class PushSubscriptionService {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    /**
     * Save (or update) a device subscription.
     *
     * This is an UPSERT: "INSERT, but if the same endpoint already exists,
     * UPDATE it instead."
     *
     * Why? Browsers refresh subscriptions, and a device re-subscribing
     * shouldn't leave stale duplicates behind (that would cause double
     * notifications). The endpoint URL is the fingerprint of "this device".
     */
    public PushSubscription saveSubscription(PushSubscription sub) {
        return pushSubscriptionRepository.findByEndpoint(sub.getEndpoint())
                .map(existing -> {
                    existing.setUserId(sub.getUserId());
                    existing.setP256dh(sub.getP256dh());
                    existing.setAuth(sub.getAuth());
                    return pushSubscriptionRepository.save(existing);
                })
                .orElseGet(() -> pushSubscriptionRepository.save(sub));
    }

    /**
     * All subscriptions a user has registered across their devices.
     * Called by the scheduler when a reminder fires — it delivers to each one.
     */
    public List<PushSubscription> getSubscriptionsForUser(String userId) {
        return pushSubscriptionRepository.findByUserId(userId);
    }

    /**
     * Remove a subscription, but ONLY if it belongs to this user
     * (same ownership check as ReminderService.deleteReminder).
     * Returns true if deleted, false if not found or wrong user.
     */
    public boolean removeSubscription(String endpoint, String userId) {
        return pushSubscriptionRepository.findByEndpoint(endpoint)
                .filter(existing -> existing.getUserId().equals(userId))
                .map(existing -> {
                    pushSubscriptionRepository.delete(existing);
                    return true;
                })
                .orElse(false);
    }
}