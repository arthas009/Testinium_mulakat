'use strict';

const { Config } = require('../config/config');
const { Logger } = require('../helpers/logger');

/**
 * Service layer for the GoREST /users API endpoint.
 *
 * SOLID application:
 *  S — Single Responsibility: knows only how to perform CRUD on /users.
 *  D — Dependency Inversion: depends on the Playwright APIRequestContext
 *      interface injected via the constructor, not on a concrete HTTP library.
 */
class UserService {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
    this.baseUrl = `${Config.api.baseUrl}/users`;
    this.headers = Object.freeze({
      Authorization: `Bearer ${Config.api.token}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    });
  }

  /** POST /users — Create a new user. */
  async createUser(userData) {
    Logger.info(`POST ${this.baseUrl} — name: "${userData.name}"`);
    return this.request.post(this.baseUrl, {
      headers: this.headers,
      data:    userData,
    });
  }

  /** GET /users — Retrieve the full user list. */
  async getAllUsers() {
    Logger.info(`GET  ${this.baseUrl}`);
    return this.request.get(this.baseUrl, { headers: this.headers });
  }

  /** GET /users/:id — Retrieve a single user by ID. */
  async getUserById(id) {
    Logger.info(`GET  ${this.baseUrl}/${id}`);
    return this.request.get(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  /** PUT /users/:id — Replace user data. */
  async updateUser(id, userData) {
    Logger.info(`PUT  ${this.baseUrl}/${id} — name: "${userData.name}"`);
    return this.request.put(`${this.baseUrl}/${id}`, {
      headers: this.headers,
      data:    userData,
    });
  }

  /** DELETE /users/:id — Remove a user. */
  async deleteUser(id) {
    Logger.info(`DELETE ${this.baseUrl}/${id}`);
    return this.request.delete(`${this.baseUrl}/${id}`, { headers: this.headers });
  }
}

module.exports = { UserService };
