package com.nexus.nexusbackend.repository;

import com.nexus.nexusbackend.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * The Repository — the ONLY layer that talks to the database.
 *
 * By extending JpaRepository<Reminder, UUID> we get all basic operations for free:
 *   save(reminder)      → INSERT or UPDATE
 *   findById(id)        → SELECT * WHERE id = ?
 *   findAll()           → SELECT *
 *   deleteById(id)      → DELETE WHERE id = ?
 *   existsById(id)      → SELECT COUNT(*) WHERE id = ?
 *
 * We add ONE custom method for our app's core need:
 *   findByUserId(userId) → SELECT * FROM reminders WHERE user_id = ?
 *
 * JPA generates the SQL automatically from the method name.
 * This is called a "derived query" — name it right, get the query for free.
 */
@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    /**
     * Find all reminders belonging to a specific Clerk user.
     * JPA reads "findBy" + "UserId" and generates:
     *   SELECT * FROM reminders WHERE user_id = ?
     *
     * This is the query every page uses — Dashboard, Upcoming, Calendar
     * all start from "get everything for this user", then filter in the frontend.
     */
    List<Reminder> findByUserId(String userId);
}
