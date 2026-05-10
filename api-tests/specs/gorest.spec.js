'use strict';

const { test, expect }  = require('@playwright/test');
const { UserService }   = require('../services/UserService');
const { Logger }        = require('../helpers/logger');

/** Generate a unique e-mail to prevent 422 conflicts on repeated runs. */
function uniqueEmail() {
  return `testinium.user.${Date.now()}@example.com`;
}

test.describe('GoREST Users API Senaryosu', () => {
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

  // ── 1. POST /users ──────────────────────────────────────────────────────────
  test('1 — Add new user: status 201 ve name doğrulaması', async ({ request }) => {
    Logger.step(1, 'Creating a new user via POST /users');
    const service  = new UserService(request);
    const response = await service.createUser(newUser);

    expect(response.status(), 'Status 201 olmalı').toBe(201);
    const body = await response.json();
    expect(body.name,  'name eşleşmeli').toBe(newUser.name);
    expect(body.email, 'email eşleşmeli').toBe(newUser.email);
    expect(body.id,    'ID dönmeli').toBeDefined();

    process.env._GOREST_USER_ID    = String(body.id);
    process.env._GOREST_USER_NAME  = newUser.name;
    process.env._GOREST_USER_EMAIL = newUser.email;
  });

  // ── 2. GET /users ──────────────────────────────────────────────────────────
  test('2 — Get all users: status 200', async ({ request }) => {
    Logger.step(2, 'Fetching all users via GET /users');
    const service  = new UserService(request);
    const response = await service.getAllUsers();

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(Array.isArray(body), 'Response dizi olmalı').toBeTruthy();
    expect(body.length, 'En az bir kullanıcı dönmeli').toBeGreaterThan(0);
  });

  // ── 3. GET /users/:id ──────────────────────────────────────────────────────
  test('3 — Get one user: id ile bilgiler doğrulanır', async ({ request }) => {
    Logger.step(3, 'Fetching single user via GET /users/:id');
    const userId = process.env._GOREST_USER_ID;
    expect(userId, 'User ID önceki testten mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.getUserById(userId);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(String(body.id)).toBe(userId);
    expect(body.name).toBe(process.env._GOREST_USER_NAME);
    expect(body.email).toBe(process.env._GOREST_USER_EMAIL);
  });

  // ── 4. PUT /users/:id ──────────────────────────────────────────────────────
  test('4 — Update user: bilgiler güncellenir ve doğrulanır', async ({ request }) => {
    Logger.step(4, 'Updating user via PUT /users/:id');
    const userId = process.env._GOREST_USER_ID;
    expect(userId, 'User ID önceki testten mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.updateUser(userId, updatedUser);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(body.name,   'name güncellenmeli').toBe(updatedUser.name);
    expect(body.email,  'email güncellenmeli').toBe(updatedUser.email);
    expect(body.status, 'status güncellenmeli').toBe(updatedUser.status);

    process.env._GOREST_UPDATED_NAME  = updatedUser.name;
    process.env._GOREST_UPDATED_EMAIL = updatedUser.email;
  });

  // ── 5. GET /users/:id after update ────────────────────────────────────────
  test('5 — Get updated user: güncelleme sonrası doğrulama', async ({ request }) => {
    Logger.step(5, 'Verifying updated data via GET /users/:id');
    const userId = process.env._GOREST_USER_ID;
    expect(userId, 'User ID önceki testten mevcut olmalı').toBeTruthy();

    const service  = new UserService(request);
    const response = await service.getUserById(userId);

    expect(response.status(), 'Status 200 olmalı').toBe(200);
    const body = await response.json();
    expect(String(body.id)).toBe(userId);
    expect(body.name,   'name doğrulanmalı').toBe(process.env._GOREST_UPDATED_NAME);
    expect(body.email,  'email doğrulanmalı').toBe(process.env._GOREST_UPDATED_EMAIL);
    expect(body.status, 'status doğrulanmalı').toBe('inactive');
  });

  // ── 6. DELETE /users/:id ──────────────────────────────────────────────────
  test('6 — Remove user: status 204 ve kullanıcı silinir', async ({ request }) => {
    Logger.step(6, 'Deleting user via DELETE /users/:id');
    const userId = process.env._GOREST_USER_ID;
    expect(userId, 'User ID önceki testten mevcut olmalı').toBeTruthy();

    const service      = new UserService(request);
    const deleteResp   = await service.deleteUser(userId);
    expect(deleteResp.status(), 'Status 204 olmalı').toBe(204);

    const getResp = await service.getUserById(userId);
    expect(getResp.status(), 'Silinen kullanıcı 404 dönmeli').toBe(404);
  });
});
