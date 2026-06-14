# AI_USAGE.md — AI Tool Usage Log

## Tools Used

| Tool | Role |
|---|---|
| **Google Gemini (Antigravity IDE)** | Primary development assistant — architecture, code generation, debugging, testing |
| **GitHub Copilot** | Inline autocomplete for boilerplate (route handlers, CSS properties) |

---

## How AI Was Used

### Architecture & Planning
Gemini was prompted to design the full system architecture including the database schema, API route structure, balance calculation algorithm, and split type strategies. The AI produced an `AI_CONTEXT.md` and `BUILD_PLAN.md` outlining the full plan before any code was written.

### Code Generation
- Full Prisma schema with all 6 models and relations
- All 7 Express route files (auth, groups, expenses, settlements, comments, dashboard, users)
- Balance calculator (`balanceCalculator.js`) — pairwise debt simplification algorithm
- Split calculator (`splitCalculator.js`) — all 4 split type implementations
- All 12 frontend React page components
- 21 Jest unit and integration tests
- Seed script with demo data
- E2E test scripts (`e2e-test.cjs`, `live-demo.cjs`)

### Debugging
- Fixed sidebar `position: fixed` breaking flex layout (content stuck on left)
- Fixed pages using old Tailwind CSS classes after design system change
- Fixed `currentUser` missing from dashboard API response

---

## Key Prompts Used

### Prompt 1 — Architecture
> "I'm building a group expense splitting app like Splitwise. Design the complete database schema, API routes, and frontend page structure. Use Node.js/Express, PostgreSQL/Prisma, React/Vite."

### Prompt 2 — Balance Algorithm
> "Implement a pairwise balance calculator for group expense splitting. Given a list of expenses (each with splits showing who owes what) and settlements (payments between members), compute: net balance for a specific user, list of who owes whom per pair."

### Prompt 3 — Split Calculator
> "Implement a splitCalculator function that takes splitType (EQUAL, UNEQUAL, PERCENTAGE, SHARE), total amount, and participants array, and returns an array of {userId, amount} splits. Handle rounding so splits always sum exactly to the total."

### Prompt 4 — Testing
> "Write Jest unit tests for the splitCalculator covering: equal split with rounding, unequal splits, percentage splits, share-based splits, and validation errors."

### Prompt 5 — Layout Fix
> "The sidebar is position:fixed which causes it to float over the content. Main content starts at left:0 and is hidden behind the sidebar. Fix this using CSS flex layout."

---

## Cases Where AI Produced Something Wrong

### Case 1: Sidebar Position Breaking Layout

**What AI produced:**
```css
.sidebar {
  position: fixed;
  left: 0; top: 0;
  height: 100%; width: 220px;
}
```

**The Problem:**  
`position: fixed` removes the sidebar from the normal document flow. The main content area's `flex: 1` had no effect because there was no flex sibling — the sidebar was a floating layer. Result: the main content started at `left: 0` and was visually hidden behind the sidebar. The UI looked "stuck on the left."

**How I caught it:**  
The user shared a screenshot showing the dashboard content was only visible in a narrow strip to the right of the sidebar (the sidebar was overlapping it). Inspecting the CSS confirmed `position: fixed` was the culprit.

**What I changed:**
```css
.sidebar {
  position: sticky;  /* stays in flex flow */
  top: 0;
  height: 100vh;
  flex-shrink: 0;
  overflow-y: auto;
}
```
This keeps the sidebar participating in the flex layout, so `flex: 1` on `.main-content` correctly fills the remaining viewport width.

---

### Case 2: Old Tailwind Classes on New Pages

**What AI produced (Profile.jsx):**
```jsx
<div className="flex">
  <Sidebar />
  <main className="main-content fade-in">
    <div className="glass-card p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>
```

**The Problem:**  
The AI generated pages using Tailwind utility classes (`text-2xl`, `font-bold`, `glass-card`, `p-8`) from Phase 1 of development. However, the design system had been migrated to vanilla CSS with inline styles and custom classes (`.card`, `.main-content`). The classes `glass-card`, `text-white`, `flex items-center` were not defined anywhere — they rendered as unstyled elements, making the Profile, GroupCreate, and Settle pages completely blank.

**How I caught it:**  
The user reported "Nothing in profile section" and shared a screenshot showing a blank white area where the content should be. Running a search for `glass-card` across the codebase confirmed it wasn't defined in `index.css`.

**What I changed:**  
Rewrote all three pages completely with inline styles matching the current design system:
```jsx
<>
  <Sidebar />
  <div className="main-content fade-up">
    <div className="card" style={{ padding: '28px' }}>
      <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Profile</h1>
```

---

### Case 3: Dashboard Missing `currentUser` in API Response

**What AI produced (dashboard.js):**
```js
return res.status(200).json({
  totalBalance,
  totalOwed,
  totalOwe,
  groupBalances,
  recentActivity,
});
```

**The Problem:**  
The frontend Dashboard component used `data?.currentUser?.name?.[0]` to render the avatar initial in the top bar. The backend `/api/dashboard` route returned all group balance and activity data but never included the `currentUser` object. The avatar showed 'A' (fallback) for every user regardless of who was logged in.

**How I caught it:**  
During the full audit (running the live demo script), I noticed the avatar initial was always the hardcoded fallback. Tracing the code from `Dashboard.jsx` → `getDashboard()` → `dashboard.js` confirmed the field was never sent.

**What I changed:**
```js
return res.status(200).json({
  currentUser: { id: req.user.id, name: req.user.name, email: req.user.email },
  totalBalance,
  totalOwed,
  totalOwe,
  groupBalances,
  recentActivity,
});
```
The `req.user` object is already available from the JWT auth middleware, so adding it to the response was a one-line fix.

---

### Case 4: Percentage Rounding Not Validated Server-Side

**What AI produced:**
```js
// No validation that percentages sum to 100
const splits = participants.map(p => ({
  userId: p.userId,
  amount: (p.percentage / 100) * amount,
}));
```

**The Problem:**  
The AI generated the PERCENTAGE split handler without validating that the percentages sum to 100. A user could submit 40% + 35% + 24% = 99%, creating ₹10 of "missing" money. The splits would appear to save successfully but the sum of split amounts would be less than the expense total.

**How I caught it:**  
Writing the unit tests for the split calculator — the test `'should reject percentages not summing to 100'` had no corresponding guard in the code, so the test failed with no error thrown.

**What I changed:**
```js
const totalPct = participants.reduce((s, p) => s + (p.percentage || 0), 0);
if (Math.abs(totalPct - 100) > 0.01) {
  throw new Error(`Percentages must sum to 100 (got ${totalPct.toFixed(2)})`);
}
```

---

### Case 5: Node.js Script Using `require()` in ESM Context

**What AI produced:**
```js
// fix-layout.js
const fs = require('fs');
```

**The Problem:**  
The AI generated a CommonJS script using `require()`, but the `frontend/package.json` had `"type": "module"`, making all `.js` files treated as ES modules. Running `node fix-layout.js` threw:
```
ReferenceError: require is not defined in ES module scope
```

**How I caught it:**  
The error message was explicit. This is a classic Node.js ESM/CJS confusion.

**What I changed:**  
Renamed the file to `fix-layout.cjs` — the `.cjs` extension forces CommonJS mode regardless of the `package.json` `"type"` field.

---

## Summary Assessment

The AI was highly effective for:
- Generating boilerplate code quickly (routes, components, tests)
- Architecture and design decisions with clear reasoning
- Debugging when given precise error messages and context

The AI required human oversight for:
- CSS layout — the `position: fixed` sidebar issue required visual feedback from a screenshot
- Design system consistency — the AI lost track of which CSS approach was active as the project evolved
- API completeness — several response fields were omitted and only caught through testing
- Environment-specific issues — ESM vs CommonJS, Windows path handling in scripts

**Overall: AI accelerated development by ~70% but required active review at every stage.**
