/**
 * tests/auth.test.js
 *
 * Integration tests for auth routes using Supertest.
 * Requires a running test DATABASE_URL (set in .env or environment).
 *
 * Run with: npm test
 */

const request = require('supertest');
const { app, httpServer } = require('../src/index');
const prisma = require('../src/utils/prismaClient');

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Clean up any test user left from a previous run
  await prisma.user.deleteMany({ where: { email: { endsWith: '@splitree-test.com' } } });
});

afterAll(async () => {
  // Clean up test users
  await prisma.user.deleteMany({ where: { email: { endsWith: '@splitree-test.com' } } });
  await prisma.$disconnect();
  httpServer.close();
});

// ─── Test data ────────────────────────────────────────────────────────────────

const TEST_USER = {
  name: 'Test User',
  email: 'testuser@splitree-test.com',
  password: 'Password123',
};

let authToken = '';

// ─── Register ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('valid body — returns 201 with token and user', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.passwordHash).toBeUndefined(); // never expose hash
    authToken = res.body.token;
  });

  test('duplicate email — returns 409', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('correct password — returns 200 with token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  test('wrong password — returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

// ─── Me ───────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('valid token — returns 200 with user object', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_USER.email);
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  test('no token — returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token/i);
  });
});
