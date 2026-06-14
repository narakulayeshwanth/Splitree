# SCOPE.md — Data Scope, Anomaly Log & Database Schema

## Project Scope

Splitree is a group expense management application. Users can create groups, record shared expenses with four split strategies, track individual balances, and record debt settlements.

---

## Database Schema

### Entity Relationship Overview

```
User ──< GroupMember >── Group
User ──< Expense (payer, creator)
User ──< ExpenseSplit
User ──< Settlement (payer, receiver)
User ──< Comment
Group ──< Expense ──< ExpenseSplit
Group ──< Settlement
Expense ──< Comment
```

### Models

#### `User`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK, auto-generated |
| name | String | Required |
| email | String | Unique, required |
| passwordHash | String | bcrypt hash, never returned in API |
| createdAt | DateTime | Auto |

#### `Group`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| name | String | Required |
| description | String | Optional |
| createdBy | String | FK → User.id |
| createdAt | DateTime | Auto |

#### `GroupMember`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| groupId | String | FK → Group.id, CASCADE |
| userId | String | FK → User.id, CASCADE |
| joinedAt | DateTime | Auto |
| | | UNIQUE(groupId, userId) — prevents duplicates |

#### `Expense`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| title | String | Required, min 1 char |
| amount | Decimal(10,2) | Required, positive |
| paidBy | String | FK → User.id |
| splitType | Enum | EQUAL / UNEQUAL / PERCENTAGE / SHARE |
| expenseDate | DateTime | Required |
| notes | String | Optional |
| groupId | String | FK → Group.id, CASCADE |
| createdBy | String | FK → User.id |
| createdAt | DateTime | Auto |
| isDeleted | Boolean | Default false — soft delete |

#### `ExpenseSplit`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| expenseId | String | FK → Expense.id, CASCADE |
| userId | String | FK → User.id, CASCADE |
| amount | Decimal(10,2) | Calculated split amount |
| shareValue | Decimal(10,2) | Nullable, used for SHARE type |
| percentage | Decimal(5,2) | Nullable, used for PERCENTAGE type |
| createdAt | DateTime | Auto |
| | | UNIQUE(expenseId, userId) |

#### `Settlement`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| groupId | String | FK → Group.id, CASCADE |
| payerId | String | FK → User.id |
| receiverId | String | FK → User.id |
| amount | Decimal(10,2) | Required, positive |
| settlementDate | DateTime | Required |
| notes | String | Optional |
| createdAt | DateTime | Auto |

#### `Comment`
| Column | Type | Constraints |
|---|---|---|
| id | String (UUID) | PK |
| expenseId | String | FK → Expense.id, CASCADE |
| userId | String | FK → User.id, CASCADE |
| text | String | Required |
| createdAt | DateTime | Auto |

#### `SplitType` (Enum)
```
EQUAL       — amount / participant count
UNEQUAL     — explicit amount per participant (must sum to total)
PERCENTAGE  — percentage per participant (must sum to 100)
SHARE       — share units, proportional to unit ratio
```

---

## Data Anomalies Found & Handled

### 1. Floating-Point Precision in Split Calculations

**Problem:** When splitting ₹100 among 3 people equally, naive division gives ₹33.333… Each split stored as Decimal(10,2) would give ₹33.33 × 3 = ₹99.99 — ₹0.01 missing.

**Detection:** Manual calculation in split calculator unit tests — `33.33 + 33.33 + 33.34 ≠ 100`.

**Resolution:** The split calculator distributes the remainder (₹0.01) to the first participant:
```js
// splitCalculator.js
const base = Math.floor((amount / n) * 100) / 100;
const remainder = Math.round((amount - base * n) * 100) / 100;
splits[0].amount += remainder; // absorb rounding error
```

---

### 2. Percentage Splits Not Summing to 100

**Problem:** A user submitting 40% + 35% + 24% = 99% would create ₹10 unaccounted money.

**Detection:** Caught during API validation design — realized no guard existed.

**Resolution:** Server-side Zod + calculator validation:
```js
const total = participants.reduce((s, p) => s + p.percentage, 0);
if (Math.abs(total - 100) > 0.01) throw new Error('Percentages must sum to 100');
```

---

### 3. Unequal Splits Not Matching Expense Total

**Problem:** User enters ₹500 + ₹400 for a ₹1000 expense — ₹100 missing.

**Detection:** Caught in `splitCalculator.test.js` during test-driven development.

**Resolution:** Validator rejects if `|sum(amounts) - total| > 0.01`:
```js
const sumAmounts = participants.reduce((s,p) => s + p.amount, 0);
if (Math.abs(sumAmounts - amount) > 0.01) throw new Error('Split amounts must equal total');
```

---

### 4. Duplicate Group Membership

**Problem:** Calling `POST /groups/:id/members` twice with the same email would attempt duplicate insert.

**Detection:** Caught during manual API testing — Prisma threw a unique constraint error with unhelpful 500 response.

**Resolution:** Explicit pre-check before insert:
```js
const existing = await prisma.groupMember.findUnique({
  where: { groupId_userId: { groupId, userId } }
});
if (existing) return res.status(409).json({ error: 'User is already a member' });
```

---

### 5. Self-Settlement (Payer = Receiver)

**Problem:** Nothing prevented a user from settling a debt with themselves — nonsensical data.

**Detection:** Noticed during settlement route design review.

**Resolution:** API guard:
```js
if (payerId === receiverId) {
  return res.status(400).json({ error: 'Payer and receiver cannot be the same person' });
}
```

---

### 6. Leaving a Group With Outstanding Balance

**Problem:** A user with ₹500 owed could leave the group, making the debt irrecoverable.

**Detection:** Identified as a business logic requirement during route design.

**Resolution:** Balance check before removal:
```js
const { userNetBalance } = calculateGroupBalances(userId, memberIds, expenses, settlements);
if (userNetBalance !== 0) return res.status(400).json({
  error: `Cannot leave with outstanding balance of ₹${Math.abs(userNetBalance).toFixed(2)}`
});
```

---

### 7. Soft Delete vs Hard Delete for Expenses

**Problem:** Hard-deleting an expense would make historical balances inconsistent — a settlement recorded based on that expense would now show an incorrect balance.

**Detection:** Architectural decision made proactively.

**Resolution:** `isDeleted: Boolean @default(false)` — all expense queries filter `isDeleted: false`. Deleted expenses are excluded from balance calculations but preserved in the database for audit trail.

---

### 8. Decimal vs Float Storage

**Problem:** JavaScript `number` type loses precision for financial values (e.g., 0.1 + 0.2 = 0.30000000000000004).

**Detection:** General financial software best practice — flagged proactively.

**Resolution:** Prisma schema uses `@db.Decimal(10, 2)` for all monetary fields (`amount`, `shareValue`, `percentage`). API always parses with `parseFloat()` and rounds to 2 decimal places before storage.

---

## Seed Data Summary

The `prisma/seed.js` creates:
- 3 users: Alice, Bob, Charlie
- 1 group: "Goa Trip" with all 3 as members
- 4 expenses: Hotel Stay (₹9000 EQUAL), Flights (₹12000 PERCENTAGE), Beach BBQ (₹6000 EQUAL), Water Sports (₹5000 EQUAL)
- 1 settlement: Bob settles ₹200 with Alice

**Anomaly handling in seed:** Seed uses `upsert` (create-or-update) so re-running doesn't duplicate data.
