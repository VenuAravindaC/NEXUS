# NEXUS — Interview Prep Notes

A living document. New concepts get added as we build them. Each entry has:
- **Concept** — what it is
- **Why it matters** — the real reason interviewers ask about it
- **Interview-style questions** — practice answering these out loud with no code visible

---

## 1. State ownership & "lifting state up"

**Concept:** When several components need the same data, you move that state to their closest common parent and pass it down via props.

In NEXUS, `reminders` state lives in `Layout` (the parent). Dashboard and Upcoming pages receive it as props via `cloneElement`. Data flows down (props), events flow up (function callbacks).

**Why it matters:** This is the #1 React architecture question. "Where should state live?" separates juniors from mid-levels.

**Questions:**
- Why is the reminders state in Layout and not in DashboardPage?
- What happens if two sibling pages both need the same state and each keeps their own copy?
- What is "lifting state up," and when would you do the opposite (push it down)?

---

## 2. useState & immutability

**Concept:** `useState` gives you a value that persists across re-renders + a setter that triggers a re-render. You update state by creating a **new** array/object, not by mutating the existing one.

```javascript
setReminders([...reminders, newReminder])   // ✅ new array
reminders.push(newReminder)                  // ❌ mutation, React ignores it
```

**Why it matters:** React compares by reference (memory address), not by contents. Mutate → same address → React thinks nothing changed → no re-render. Interviewers love asking WHY React works this way.

**Questions:**
- Why must you call the setter instead of mutating the variable directly?
- What does the spread operator `[...arr]` do, and why is it necessary for React state?
- What happens if you mutate state and call setX with the same reference?

---

## 3. Conditional rendering

**Concept:** Two patterns render UI conditionally.
- `{condition && <Component />}` — renders Component only if condition is true; otherwise nothing.
- `{cond ? <A/> : <B/>}` — ternary, for either/or.

**Why it matters:** Almost every real UI has empty states, loading states, role-based UI. You need to express "if X then this, else that" in JSX.

**Questions:**
- How do you render a component only when a condition is true?
- How would you show an empty state vs a list using one of these patterns?
- When would you use `&&` vs a ternary?

---

## 4. Controlled inputs

**Concept:** An input where React owns the value. `value={state}` + `onChange={e => setState(e.target.value)}`. The input never holds its own value — React does.

**Why it matters:** Lets you validate, transform, reset, and pre-fill inputs programmatically. Uncontrolled inputs (the alternative) are harder to manipulate from code.

**Questions:**
- What makes an input "controlled"? What are the two props you must set?
- How would you reset a controlled input after a form submit?
- What happens if you set `value` without an `onChange`?

---

## 5. Guard clauses

**Concept:** An early `return` that stops a function when inputs are invalid, before doing the real work.

```javascript
if (!title.trim()) return   // don't save empty-titled reminders
```

**Questions:**
- What does `!title.trim()` evaluate to when the title is just spaces?
- Why return early instead of wrapping the rest in an `if`?

---

## 6. Component composition & passing functions as props

**Concept:** A child component that triggers changes in parent state does NOT call the setter directly — it's passed a callback (`onToggleDone`, `onDelete`) and just signals the event up.

**Why it matters:** Keeps components reusable and decoupled. The waiter (ReminderCard) takes the order; the kitchen (DashboardPage) cooks.

**Questions:**
- Why can't ReminderCard call `setReminders` directly?
- How does a child component communicate an event to its parent?
- Why is this pattern better than each component managing shared state itself?

---

## 7. Event handler wrapper: `() => fn(id)` vs `fn(id)`

**Concept:** When passing a function that needs an argument to `onClick`, wrap it: `onClick={() => onToggleDone(reminder.id)}`. Without the wrapper, the function runs immediately on render instead of on click.

**Questions:**
- What's the difference between `onClick={fn(id)}` and `onClick={() => fn(id)}`?
- Which one runs immediately when the component mounts?
- How would you call an event handler that also needs the event object?

---

## 8. .map() — transform lists

**Concept:** `.map()` loops over an array, runs a function on each item, and returns a **new array** of results. The original is never modified.

Used two ways in React:
- **Rendering:** `reminders.map(r => <Card key={r.id} />)` turns data into JSX.
- **Updating one item:** `reminders.map(r => r.id === id ? {...r, isDone: !r.isDone} : r)` returns a new array with one item replaced.

**Why it matters:** Core to declarative UI. You describe "what the list looks like given this data" and React handles the DOM.

**Questions:**
- Does `.map()` mutate the original array?
- Why does every item in a rendered list need a unique `key`?
- How do you update a single object inside an array immutably?

---

## 9. .filter() — remove items

**Concept:** `.filter()` returns a **new array** with only items that pass a test. `reminders.filter(r => r.id !== id)` keeps everything except the one being deleted.

**Questions:**
- How would you delete one item from an array immutably?
- What's the difference between `.filter()` and `.map()` when do you use each?

---

## 10. Object spread: `{ ...obj, field: newValue }`

**Concept:** Copy all fields of an existing object into a new object, then override specific fields. Used to update one property without mutating.

```javascript
{ ...reminder, isDone: !reminder.isDone }
```
Copies every field from `reminder`, then overwrites `isDone`.

**Questions:**
- Why `{...r, isDone: true}` instead of `r.isDone = true`?
- If two objects have the same key, which wins — the spread base or the literal override?

---

## 11. Dynamic classNames (template literals + ternary)

**Concept:** Use backticks to build className strings, with a `${condition ? 'a' : 'b'}` ternary inside to swap classes based on state. Lets one element have different styles in different states.

```javascript
className={`base ${isDone ? 'bg-white' : 'border-gray-500'}`}
```

**Questions:**
- How do you conditionally apply a Tailwind class?
- Why use backticks instead of normal quotes for className?

---

## 12. Checkbox two-state UI pattern

**Concept:** One element, two visual states driven by one boolean.
- **Classes:** ternary picks "filled white" (done) vs "empty gray border" (not done).
- **Icon:** `{isDone && <Check/>}` renders the checkmark only when done.
- **Click:** calls `onToggleDone(id)` to signal up.

**Questions:**
- Walk through what the checkbox does across the two states.
- Why wrap the click in `() => fn(id)`?

---
---

## Status checklist (fill in as you own each concept)
- [ ] State ownership / lifting state up
- [ ] useState & immutability (spread, why no mutation)
- [ ] Conditional rendering (&&, ternary)
- [ ] Controlled inputs
- [ ] Guard clauses
- [ ] Passing functions as props (callbacks up)
- [ ] Event handler wrapper `() => fn(id)`
- [ ] .map() — rendering & updates
- [ ] .filter() — deletes
- [ ] Object spread `{...r, field: val}`
- [ ] Dynamic classNames
- [ ] Checkbox two-state pattern
