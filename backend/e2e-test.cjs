/**
 * Splitree E2E API Demo — runs against http://localhost:3000
 * Tests every major flow: Auth → Groups → Expenses → Balances → Settle → Comments
 */
const http = require('http');

const BASE = 'http://localhost:3000';
let TOKEN = '';
let alice = null, bob = null;
let groupId = '';
let expenseId = '';

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log(`  ✅ ${name}`); passed++; }
  else       { console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); failed++; }
}

// ─── Tests ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n========================================');
  console.log('  Splitree E2E API Test Suite');
  console.log('========================================\n');

  // ── 1. Health Check ────────────────────────────────────────────────────────
  console.log('1. Health Check');
  const health = await req('GET', '/health');
  check('Server responds', health.status === 200);
  check('Status is ok', health.body.status === 'ok');

  // ── 2. Auth — Register new test users ─────────────────────────────────────
  console.log('\n2. Auth — Register');
  const ts = Date.now();
  const regAlice = await req('POST', '/api/auth/register', {
    name: 'Test Alice', email: `alice_${ts}@test.com`, password: 'password123'
  });
  check('Register Alice (201)', regAlice.status === 201, JSON.stringify(regAlice.body));
  check('Alice token returned', !!regAlice.body.token);
  alice = regAlice.body.user;
  TOKEN = regAlice.body.token;

  const regBob = await req('POST', '/api/auth/register', {
    name: 'Test Bob', email: `bob_${ts}@test.com`, password: 'password123'
  });
  check('Register Bob (201)', regBob.status === 201);
  bob = regBob.body.user;

  // ── 3. Auth — Login ────────────────────────────────────────────────────────
  console.log('\n3. Auth — Login');
  const login = await req('POST', '/api/auth/login', {
    email: `alice_${ts}@test.com`, password: 'password123'
  });
  check('Login success (200)', login.status === 200, JSON.stringify(login.body));
  check('Token returned', !!login.body.token);
  TOKEN = login.body.token; // use login token from here

  const badLogin = await req('POST', '/api/auth/login', {
    email: `alice_${ts}@test.com`, password: 'wrongpassword'
  });
  check('Bad password rejected (401)', badLogin.status === 401);

  // ── 4. Auth — /me ─────────────────────────────────────────────────────────
  console.log('\n4. Auth — /me');
  const me = await req('GET', '/api/auth/me', null, TOKEN);
  check('Get /me (200)', me.status === 200);
  check('Name matches', me.body.name === 'Test Alice');

  // ── 5. Groups ─────────────────────────────────────────────────────────────
  console.log('\n5. Groups');
  const createGroup = await req('POST', '/api/groups', {
    name: 'E2E Test Trip', description: 'Automated test group'
  }, TOKEN);
  check('Create group (201)', createGroup.status === 201, JSON.stringify(createGroup.body));
  check('Group name correct', createGroup.body.name === 'E2E Test Trip');
  groupId = createGroup.body.id;
  check('Group ID received', !!groupId);

  const listGroups = await req('GET', '/api/groups', null, TOKEN);
  check('List groups (200)', listGroups.status === 200);
  check('Group appears in list', Array.isArray(listGroups.body) && listGroups.body.some(g => g.id === groupId));

  const getGroup = await req('GET', `/api/groups/${groupId}`, null, TOKEN);
  check('Get group detail (200)', getGroup.status === 200);
  check('Creator auto-added as member', getGroup.body.members?.some(m => m.id === alice.id));

  // ── 6. Add member ─────────────────────────────────────────────────────────
  console.log('\n6. Members');
  const addMember = await req('POST', `/api/groups/${groupId}/members`, {
    email: `bob_${ts}@test.com`
  }, TOKEN);
  check('Add Bob as member (201)', addMember.status === 201, JSON.stringify(addMember.body));

  const groupAfter = await req('GET', `/api/groups/${groupId}`, null, TOKEN);
  check('Bob now in members', groupAfter.body.members?.some(m => m.id === bob.id));

  // ── 7. Expenses — Equal Split ──────────────────────────────────────────────
  console.log('\n7. Expenses — EQUAL split');
  const exp1 = await req('POST', `/api/groups/${groupId}/expenses`, {
    title: 'E2E Dinner', amount: 1000, paidBy: alice.id,
    splitType: 'EQUAL', expenseDate: new Date().toISOString(), notes: 'test',
    participants: [{ userId: alice.id }, { userId: bob.id }],
  }, TOKEN);
  check('Create EQUAL expense (201)', exp1.status === 201, JSON.stringify(exp1.body));
  check('Title correct', exp1.body.title === 'E2E Dinner');
  check('2 splits created', exp1.body.splits?.length === 2);
  check('Each split = 500', exp1.body.splits?.every(s => parseFloat(s.amount) === 500));
  expenseId = exp1.body.id;

  // ── 8. Expenses — Percentage Split ────────────────────────────────────────
  console.log('\n8. Expenses — PERCENTAGE split');
  const exp2 = await req('POST', `/api/groups/${groupId}/expenses`, {
    title: 'E2E Hotel', amount: 3000, paidBy: alice.id,
    splitType: 'PERCENTAGE', expenseDate: new Date().toISOString(),
    participants: [
      { userId: alice.id, percentage: 60 },
      { userId: bob.id, percentage: 40 },
    ],
  }, TOKEN);
  check('Create PERCENTAGE expense (201)', exp2.status === 201, JSON.stringify(exp2.body));
  const aliceSplit = exp2.body.splits?.find(s => s.userId === alice.id);
  const bobSplit   = exp2.body.splits?.find(s => s.userId === bob.id);
  check('Alice split = 1800 (60%)', parseFloat(aliceSplit?.amount) === 1800);
  check('Bob split = 1200 (40%)',   parseFloat(bobSplit?.amount)   === 1200);

  // ── 9. Get Expense Detail ─────────────────────────────────────────────────
  console.log('\n9. Expense Detail');
  const getExp = await req('GET', `/api/groups/${groupId}/expenses/${expenseId}`, null, TOKEN);
  check('Get expense (200)', getExp.status === 200);
  check('Splits included', Array.isArray(getExp.body.splits));
  check('Comments included', Array.isArray(getExp.body.comments));
  check('Payer name included', !!getExp.body.payer?.name);

  // ── 10. List Expenses ─────────────────────────────────────────────────────
  console.log('\n10. List Expenses');
  const listExp = await req('GET', `/api/groups/${groupId}/expenses`, null, TOKEN);
  check('List expenses (200)', listExp.status === 200);
  check('Both expenses returned', listExp.body.length === 2);

  // ── 11. Balances ──────────────────────────────────────────────────────────
  console.log('\n11. Balances');
  const balances = await req('GET', `/api/groups/${groupId}/balances`, null, TOKEN);
  check('Get balances (200)', balances.status === 200);
  check('userBalance is a number', typeof balances.body.userBalance === 'number' || !isNaN(parseFloat(balances.body.userBalance)));
  check('balances array returned', Array.isArray(balances.body.balances));
  // Alice paid 1000+3000=4000, her share = 500+1800=2300, so she is owed 1700
  const aliceNet = parseFloat(balances.body.userBalance);
  check(`Alice net balance is positive (owed money): ${aliceNet}`, aliceNet > 0);

  // ── 12. Comments ──────────────────────────────────────────────────────────
  console.log('\n12. Comments');
  const comment = await req('POST', `/api/expenses/${expenseId}/comments`, {
    text: 'E2E test comment — automated'
  }, TOKEN);
  check('Create comment (201)', comment.status === 201, JSON.stringify(comment.body));
  check('Comment text matches', comment.body.text === 'E2E test comment — automated');
  check('User attached', !!comment.body.user?.name);

  const listComments = await req('GET', `/api/expenses/${expenseId}/comments`, null, TOKEN);
  check('List comments (200)', listComments.status === 200);
  check('1 comment returned', listComments.body.length === 1);

  // ── 13. Settlements ───────────────────────────────────────────────────────
  console.log('\n13. Settlements');
  const bobToken = regBob.body.token;
  const settle = await req('POST', `/api/groups/${groupId}/settlements`, {
    payerId: bob.id, receiverId: alice.id,
    amount: 500, settlementDate: new Date().toISOString(), notes: 'partial payment'
  }, bobToken);
  check('Create settlement (201)', settle.status === 201, JSON.stringify(settle.body));
  check('Amount correct', parseFloat(settle.body.amount) === 500);

  // Balances should decrease after settlement
  const balAfter = await req('GET', `/api/groups/${groupId}/balances`, null, TOKEN);
  const aliceNetAfter = parseFloat(balAfter.body.userBalance);
  check(`Alice net after settle (was ${aliceNet}, now ${aliceNetAfter})`, aliceNetAfter === aliceNet - 500);

  // ── 14. Dashboard ─────────────────────────────────────────────────────────
  console.log('\n14. Dashboard');
  const dash = await req('GET', '/api/dashboard', null, TOKEN);
  check('Dashboard (200)', dash.status === 200);
  check('currentUser returned', !!dash.body.currentUser?.name);
  check('groupBalances array', Array.isArray(dash.body.groupBalances));
  check('recentActivity array', Array.isArray(dash.body.recentActivity));
  check('Test group appears in dashboard', dash.body.groupBalances.some(g => g.groupId === groupId));

  // ── 15. Auth — Protected route without token ───────────────────────────────
  console.log('\n15. Security');
  const unauth = await req('GET', '/api/dashboard');
  check('No token rejected (401)', unauth.status === 401);
  const invalidToken = await req('GET', '/api/dashboard', null, 'bad_token');
  check('Invalid token rejected (401)', invalidToken.status === 401);

  // ── 16. Soft Delete ───────────────────────────────────────────────────────
  console.log('\n16. Soft Delete');
  const del = await req('DELETE', `/api/groups/${groupId}/expenses/${expenseId}`, null, TOKEN);
  check('Delete expense (200)', del.status === 200);
  const listAfterDel = await req('GET', `/api/groups/${groupId}/expenses`, null, TOKEN);
  check('Deleted expense excluded from list', listAfterDel.body.every(e => e.id !== expenseId));

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`  Results: ${passed} passed / ${failed} failed / ${passed + failed} total`);
  console.log('========================================\n');
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error('\nFATAL:', err.message); process.exit(1); });
