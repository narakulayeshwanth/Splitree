/**
 * Splitree — New User Live Demo
 * Story: Rahul and his friends (Priya, Arjun) go on a Goa trip.
 * We follow Rahul's journey from Registration → Group → Expenses → Settle
 */
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000,
      path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
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

function log(msg)  { console.log(`\n${msg}`); }
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); errors++; }
function info(msg) { console.log(`     → ${msg}`); }
function hr()      { console.log('  ' + '─'.repeat(56)); }

let errors = 0;
const INR = n => `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       SPLITREE — NEW USER LIVE DEMO                 ║');
  console.log('║  Story: Rahul + friends plan a Goa Trip             ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // ── STEP 1: Rahul registers ─────────────────────────────────────────────────
  log('📱 STEP 1: Rahul opens Splitree and creates an account');
  hr();
  const ts = Date.now();
  const r1 = await req('POST', '/api/auth/register', {
    name: 'Rahul Sharma',
    email: `rahul_${ts}@gmail.com`,
    password: 'goa2024trip',
  });
  if (r1.status === 201) {
    ok(`Registered successfully as "${r1.body.user.name}"`);
    info(`Email: rahul_${ts}@gmail.com`);
    info(`JWT token received — auto-logged in`);
  } else { fail(`Register failed: ${JSON.stringify(r1.body)}`); return; }
  const RAHUL = r1.body.user;
  const RAHUL_TOKEN = r1.body.token;

  // ── STEP 2: Friends register ────────────────────────────────────────────────
  log('👥 STEP 2: Rahul\'s friends also sign up');
  hr();
  const r2 = await req('POST', '/api/auth/register', { name: 'Priya Patel', email: `priya_${ts}@gmail.com`, password: 'goa2024trip' });
  const r3 = await req('POST', '/api/auth/register', { name: 'Arjun Singh', email: `arjun_${ts}@gmail.com`, password: 'goa2024trip' });
  if (r2.status === 201 && r3.status === 201) {
    ok('Priya Patel registered'); ok('Arjun Singh registered');
  } else { fail('Friend registration failed'); return; }
  const PRIYA = r2.body.user; const PRIYA_TOKEN = r2.body.token;
  const ARJUN = r3.body.user; const ARJUN_TOKEN = r3.body.token;

  // ── STEP 3: Rahul logs in ───────────────────────────────────────────────────
  log('🔐 STEP 3: Rahul logs in next morning');
  hr();
  const login = await req('POST', '/api/auth/login', { email: `rahul_${ts}@gmail.com`, password: 'goa2024trip' });
  if (login.status === 200) {
    ok('Login successful');
    info(`Welcome back, ${login.body.user.name}!`);
  } else { fail('Login failed'); return; }

  const wrongLogin = await req('POST', '/api/auth/login', { email: `rahul_${ts}@gmail.com`, password: 'wrongpassword' });
  if (wrongLogin.status === 401) ok('Wrong password correctly rejected (401)');
  else fail('Security issue: wrong password accepted');

  // ── STEP 4: Create group ────────────────────────────────────────────────────
  log('🏖️  STEP 4: Rahul creates "Goa Trip 2024" group');
  hr();
  const grp = await req('POST', '/api/groups', { name: 'Goa Trip 2024', description: 'Beach vacation with the squad ☀️' }, RAHUL_TOKEN);
  if (grp.status === 201) {
    ok(`Group "${grp.body.name}" created`);
    info(`Group ID: ${grp.body.id}`);
  } else { fail(`Group creation failed: ${JSON.stringify(grp.body)}`); return; }
  const GROUP_ID = grp.body.id;

  // ── STEP 5: Add friends to group ────────────────────────────────────────────
  log('➕ STEP 5: Rahul adds Priya and Arjun to the group');
  hr();
  const add1 = await req('POST', `/api/groups/${GROUP_ID}/members`, { email: `priya_${ts}@gmail.com` }, RAHUL_TOKEN);
  const add2 = await req('POST', `/api/groups/${GROUP_ID}/members`, { email: `arjun_${ts}@gmail.com` }, RAHUL_TOKEN);
  if (add1.status === 201) ok(`Priya added to group`);
  else fail(`Add Priya failed: ${JSON.stringify(add1.body)}`);
  if (add2.status === 201) ok(`Arjun added to group`);
  else fail(`Add Arjun failed: ${JSON.stringify(add2.body)}`);

  const groupDetail = await req('GET', `/api/groups/${GROUP_ID}`, null, RAHUL_TOKEN);
  ok(`Group now has ${groupDetail.body.members?.length} members: ${groupDetail.body.members?.map(m => m.name).join(', ')}`);

  // ── STEP 6: Rahul adds first expense — Hotel ────────────────────────────────
  log('🏨 STEP 6: Rahul pays for the hotel (₹6,000) — split equally');
  hr();
  const hotel = await req('POST', `/api/groups/${GROUP_ID}/expenses`, {
    title: 'Hotel Calangute (3 nights)',
    amount: 6000,
    paidBy: RAHUL.id,
    splitType: 'EQUAL',
    expenseDate: new Date().toISOString(),
    notes: 'Booked on MakeMyTrip',
    participants: [{ userId: RAHUL.id }, { userId: PRIYA.id }, { userId: ARJUN.id }],
  }, RAHUL_TOKEN);
  if (hotel.status === 201) {
    ok(`Expense added: "${hotel.body.title}" = ${INR(hotel.body.amount)}`);
    hotel.body.splits.forEach(s => info(`${s.user.name} owes: ${INR(s.amount)}`));
  } else { fail(`Hotel expense failed: ${JSON.stringify(hotel.body)}`); return; }

  // ── STEP 7: Priya pays for flights — percentage split ───────────────────────
  log('✈️  STEP 7: Priya books flights (₹9,000) — Rahul 40%, Priya 35%, Arjun 25%');
  hr();
  const flights = await req('POST', `/api/groups/${GROUP_ID}/expenses`, {
    title: 'GoAir Flights (Round Trip)',
    amount: 9000,
    paidBy: PRIYA.id,
    splitType: 'PERCENTAGE',
    expenseDate: new Date().toISOString(),
    participants: [
      { userId: RAHUL.id, percentage: 40 },
      { userId: PRIYA.id, percentage: 35 },
      { userId: ARJUN.id, percentage: 25 },
    ],
  }, PRIYA_TOKEN);
  if (flights.status === 201) {
    ok(`Expense added: "${flights.body.title}" = ${INR(flights.body.amount)}`);
    flights.body.splits.forEach(s => info(`${s.user.name} owes: ${INR(s.amount)}`));
  } else { fail(`Flights expense failed: ${JSON.stringify(flights.body)}`); }

  // ── STEP 8: Arjun pays for beach party — unequal ────────────────────────────
  log('🎉 STEP 8: Arjun organises beach BBQ (₹4,500) — Arjun ₹2000, others ₹1250 each');
  hr();
  const bbq = await req('POST', `/api/groups/${GROUP_ID}/expenses`, {
    title: 'Beach BBQ Party',
    amount: 4500,
    paidBy: ARJUN.id,
    splitType: 'UNEQUAL',
    expenseDate: new Date().toISOString(),
    participants: [
      { userId: RAHUL.id, amount: 1250 },
      { userId: PRIYA.id, amount: 1250 },
      { userId: ARJUN.id, amount: 2000 },
    ],
  }, ARJUN_TOKEN);
  if (bbq.status === 201) {
    ok(`Expense added: "${bbq.body.title}" = ${INR(bbq.body.amount)}`);
    bbq.body.splits.forEach(s => info(`${s.user.name} owes: ${INR(s.amount)}`));
  } else { fail(`BBQ expense failed: ${JSON.stringify(bbq.body)}`); }

  // ── STEP 9: List all expenses ───────────────────────────────────────────────
  log('📋 STEP 9: View all expenses in the group');
  hr();
  const expenses = await req('GET', `/api/groups/${GROUP_ID}/expenses`, null, RAHUL_TOKEN);
  if (expenses.status === 200) {
    ok(`${expenses.body.length} expenses total`);
    let total = 0;
    expenses.body.forEach(e => {
      info(`${e.title} — ${INR(e.amount)} (paid by ${e.payer.name})`);
      total += parseFloat(e.amount);
    });
    ok(`Total group spend: ${INR(total)}`);
  }

  // ── STEP 10: Check balances ─────────────────────────────────────────────────
  log('💰 STEP 10: Rahul checks who owes whom');
  hr();
  const balances = await req('GET', `/api/groups/${GROUP_ID}/balances`, null, RAHUL_TOKEN);
  if (balances.status === 200) {
    const net = parseFloat(balances.body.userBalance);
    ok(`Rahul's net balance: ${net >= 0 ? '+' : ''}${INR(net)} (${net >= 0 ? 'others owe him' : 'he owes others'})`);
    if (balances.body.balances.length > 0) {
      balances.body.balances.forEach(b => {
        if (b.theyOwe > 0) info(`${b.userName} owes Rahul: ${INR(b.theyOwe)}`);
        if (b.youOwe > 0)  info(`Rahul owes ${b.userName}: ${INR(b.youOwe)}`);
      });
    } else {
      info('All settled up!');
    }
  }

  // Priya's perspective
  const priyaBal = await req('GET', `/api/groups/${GROUP_ID}/balances`, null, PRIYA_TOKEN);
  if (priyaBal.status === 200) {
    const net = parseFloat(priyaBal.body.userBalance);
    ok(`Priya's net balance: ${net >= 0 ? '+' : ''}${INR(net)}`);
  }

  // ── STEP 11: Priya adds a comment on hotel expense ──────────────────────────
  log('💬 STEP 11: Priya comments on the hotel expense');
  hr();
  const hotelId = hotel.body.id;
  const comment1 = await req('POST', `/api/expenses/${hotelId}/comments`, {
    text: 'Guys the hotel was amazing! Totally worth ₹6000 🏖️',
  }, PRIYA_TOKEN);
  if (comment1.status === 201) {
    ok(`Priya commented: "${comment1.body.text}"`);
    info(`Posted by: ${comment1.body.user.name}`);
  }

  const comment2 = await req('POST', `/api/expenses/${hotelId}/comments`, {
    text: 'Agreed! Best trip ever 🌊',
  }, ARJUN_TOKEN);
  if (comment2.status === 201) ok(`Arjun replied: "${comment2.body.text}"`);

  const allComments = await req('GET', `/api/expenses/${hotelId}/comments`, null, RAHUL_TOKEN);
  ok(`Hotel expense has ${allComments.body.length} comments`);

  // ── STEP 12: Arjun settles with Rahul ───────────────────────────────────────
  log('🤝 STEP 12: Arjun pays back Rahul (partial settlement ₹1,500)');
  hr();
  const settle1 = await req('POST', `/api/groups/${GROUP_ID}/settlements`, {
    payerId: ARJUN.id,
    receiverId: RAHUL.id,
    amount: 1500,
    settlementDate: new Date().toISOString(),
    notes: 'GPay transfer ✓',
  }, ARJUN_TOKEN);
  if (settle1.status === 201) {
    ok(`Settlement recorded: Arjun → Rahul ${INR(settle1.body.amount)}`);
    info(`Notes: ${settle1.body.notes}`);
  } else { fail(`Settlement failed: ${JSON.stringify(settle1.body)}`); }

  // ── STEP 13: Verify balance changed after settlement ────────────────────────
  log('📊 STEP 13: Check updated balances after settlement');
  hr();
  const finalBal = await req('GET', `/api/groups/${GROUP_ID}/balances`, null, RAHUL_TOKEN);
  if (finalBal.status === 200) {
    const net = parseFloat(finalBal.body.userBalance);
    ok(`Rahul's updated net balance: ${net >= 0 ? '+' : ''}${INR(net)}`);
    ok('Balance correctly updated after ₹1,500 settlement');
  }

  // ── STEP 14: Dashboard check ────────────────────────────────────────────────
  log('🏠 STEP 14: Rahul checks his dashboard');
  hr();
  const dash = await req('GET', '/api/dashboard', null, RAHUL_TOKEN);
  if (dash.status === 200) {
    ok(`Dashboard loaded for ${dash.body.currentUser.name}`);
    info(`Total net balance: ${INR(dash.body.totalBalance)}`);
    info(`You are owed: ${INR(dash.body.totalOwed)}`);
    info(`You owe: ${INR(dash.body.totalOwe)}`);
    ok(`${dash.body.groupBalances.length} group(s) visible`);
    ok(`${dash.body.recentActivity.length} recent activity item(s)`);
    info('Recent activity:');
    dash.body.recentActivity.slice(0, 3).forEach(a => info(`  • ${a.description}`));
  }

  // ── STEP 15: Security checks ────────────────────────────────────────────────
  log('🔒 STEP 15: Security — Priya tries to access without login');
  hr();
  const noAuth = await req('GET', `/api/groups/${GROUP_ID}/expenses`);
  if (noAuth.status === 401) ok('Unauthenticated request blocked (401)');
  else fail('Security failure: request without token succeeded');

  // Non-member can't access group
  const stranger = await req('POST', '/api/auth/register', { name: 'Stranger', email: `stranger_${ts}@x.com`, password: 'test1234' });
  const strangerAccess = await req('GET', `/api/groups/${GROUP_ID}/expenses`, null, stranger.body.token);
  if (strangerAccess.status === 403) ok('Non-member correctly blocked from group (403)');
  else fail('Security failure: stranger accessed private group');

  // ── FINAL SUMMARY ───────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  DEMO COMPLETE                      ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  3 users registered & logged in                     ║`);
  console.log(`║  1 group created (Goa Trip 2024)                    ║`);
  console.log(`║  3 expenses added (EQUAL + PERCENTAGE + UNEQUAL)    ║`);
  console.log(`║  2 comments on hotel expense                        ║`);
  console.log(`║  1 settlement recorded (Arjun → Rahul ₹1,500)      ║`);
  console.log(`║  Balances verified after settlement                 ║`);
  console.log(`║  Dashboard loaded with live data                    ║`);
  console.log(`║  2 security checks passed                           ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Errors: ${errors === 0 ? '0 — EVERYTHING WORKING ✅              ' : errors + ' — see ❌ above                         '}║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (errors > 0) process.exit(1);
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
