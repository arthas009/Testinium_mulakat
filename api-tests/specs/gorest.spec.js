'use strict';

const { test, expect }  = require('@playwright/test');
const { UserService }   = require('../services/UserService');
const { Logger }        = require('../helpers/logger');

/** Generate a unique e-mail to prevent 422 conflicts on repeated runs. */
function uniqueEmail() {
  return `testinium.user.${Date.now()}@example.com`;
}

test.describe.serial('GoREST Users API Senaryosu', () => {
  // Shared state — safe because .serial guarantees same-worker sequential execution.
  let createdUserId;

  const newUser = Object.freeze({
    name:   'Testinium Playwright User',
    email:  uniqueEmail(),
    gender: 'male',
    status: 'active',
  });

  const updatedUser = Object.freeze({
    name:   'Testinium Updated User',
    email:  uniqueEmail(),
    gender: 'male',
    status: 'inactive',
  });

  // ── TC-1: POST /users ──────────────────────────────────────────────────────
  test('TC-1 — Add new user: status 201 ve name doğrulaması', async ({ request }) => {
    Logger.step(1, 'Creating a new user via POST /users');
    const service  = new UserService(request);
    const response = await service.createUser(newUser);

    expect(response.status(), 'Status 201 olmalı').toBe(201);
    const body = await response.json();
    expect(body.name,  'Request body name ile response name eşleşmeli').toBe(newUser.name);
    expect(body.email, 'email eşleşmeli').toBe(newUser.email);
    expect(body.id,    'ID dönmeli').toBeDefined();

    createdUserId = String(body.id);
  });

  // ── TC-2: GET /users ───────────────────────────────────────────────────────
  test('TC-2 — Get all users: status 200', async ({ request }) => {
    Logger.step(2, 'Fetching all users via GET /users');
    const service  = new UserService(request);
    const response = await service.getAllUsers();

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(Array.isArray(body), 'Response dizi olmalı').toBeTruthy();
    expect(body.length, 'En az bir kullanıcı dönmeli').toBeGreaterThan(0);
  });

  // ── TC-3: GET /users/:id ───────────────────────────────────────────────────
  test('TC-3 — Get one user: id ile kullanıcı bilgileri doğrulanır', async ({ request }) => {
    Logger.step(3, 'Fetching single user via GET /users/:id');
    expect(createdUserId, 'User ID TC-1\'den mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.getUserById(createdUserId);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(String(body.id),  'ID eşleşmeli').toBe(createdUserId);
    expect(body.name,        'name eşleşmeli').toBe(newUser.name);
    expect(body.email,       'email eşleşmeli').toBe(newUser.email);
  });

  // ── TC-4: PUT /users/:id ───────────────────────────────────────────────────
  test('TC-4 — Update user: kullanıcı bilgileri değiştirilir ve doğrulanır', async ({ request }) => {
    Logger.step(4, 'Updating user via PUT /users/:id');
    expect(createdUserId, 'User ID TC-1\'den mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.updateUser(createdUserId, updatedUser);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(body.name,   'name güncellenmeli').toBe(updatedUser.name);
    expect(body.email,  'email güncellenmeli').toBe(updatedUser.email);
    expect(body.status, 'status güncellenmeli').toBe(updatedUser.status);
  });

  // ── TC-5: GET /users/:id after update ─────────────────────────────────────
  test('TC-5 — Get one user (after update): güncellenen bilgiler doğrulanır', async ({ request }) => {
    Logger.step(5, 'Verifying updated data via GET /users/:id');
    expect(createdUserId, 'User ID TC-1\'den mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.getUserById(createdUserId);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(String(body.id),  'ID eşleşmeli').toBe(createdUserId);
    expect(body.name,        'güncellenen name doğrulanmalı').toBe(updatedUser.name);
    expect(body.email,       'güncellenen email doğrulanmalı').toBe(updatedUser.email);
    expect(body.status,      'güncellenen status doğrulanmalı').toBe(updatedUser.status);
  });

  // ── TC-6: DELETE /users/:id ────────────────────────────────────────────────
  test('TC-6 — Remove user: status 204 döndüğü kontrol edilir', async ({ request }) => {
    Logger.step(6, 'Deleting user via DELETE /users/:id');
    expect(createdUserId, 'User ID TC-1\'den mevcut olmalı').toBeTruthy();

    const service    = new UserService(request);
    const deleteResp = await service.deleteUser(createdUserId);
    expect(deleteResp.status(), 'Status 204 olmalı').toBe(204);

    const getResp = await service.getUserById(createdUserId);
    expect(getResp.status(), 'Silinen kullanıcı 404 dönmeli').toBe(404);
  });
});
