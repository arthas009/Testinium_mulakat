# Playwright JavaScript Test Automation Framework — Technical Document

**Project:** Grimelange UI + GoREST API Test Suite  
**Language:** JavaScript (Node.js)  
**Framework:** Playwright (`@playwright/test`)  
**Pattern:** Page Object Model (POM)  
**Principles:** SOLID, DRY, Single Source of Truth  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Design Principles](#4-architecture--design-principles)
5. [Layer Descriptions](#5-layer-descriptions)
   - [config/](#51-config)
   - [constants/](#52-constants)
   - [helpers/](#53-helpers)
   - [pages/](#54-pages)
   - [services/](#55-services)
   - [tests/](#56-tests)
6. [Configuration](#6-configuration)
7. [Test Scenarios](#7-test-scenarios)
   - [UI — Grimelange](#71-ui--grimelange)
   - [API — GoREST](#72-api--gorest)
8. [Running the Tests](#8-running-the-tests)
9. [Reports & Artifacts](#9-reports--artifacts)
10. [Environment Setup](#10-environment-setup)
11. [Dependency Graph](#11-dependency-graph)

---

## 1. Project Overview

This project is a fully automated test suite built with **Playwright** in **JavaScript**. It covers two separate test domains:

| Domain | Target | Type |
|--------|--------|------|
| UI     | [grimelange.com.tr](https://www.grimelange.com.tr) | End-to-end browser test |
| API    | [gorest.co.in](https://gorest.co.in) | REST API service test |

Key characteristics:
- **Page Object Model** — each page/component is encapsulated in its own class
- **Central selector registry** — all CSS selectors live in a single file
- **SOLID design** — classes have one job and depend on abstractions, not concretions
- **Video recording** — every test run is recorded for visual evidence
- **Yellow element highlighting** — every interacted element is highlighted visually
- **Resilient navigation** — multi-strategy fallback ensures test execution continues even when the site's menu interaction model changes
- **Soft assertions** — non-critical verifications are reported without stopping the run
- **Automatic retry** — failed tests are retried once before being marked as failed

---

## 2. Folder Structure

```
Testinium/
│
├── .env                          # Environment variables (token, secrets)
├── playwright.config.js          # Playwright global configuration
├── package.json                  # npm scripts and dependencies
│
├── config/
│   └── config.js                 # Centralised app config (URLs, timeouts, token)
│
├── constants/
│   ├── locators.js               # All CSS/text selectors (single source of truth)
│   └── urls.js                   # All page URLs derived from config
│
├── helpers/
│   ├── highlight.js              # Yellow element highlighter
│   ├── logger.js                 # Structured console logger
│   └── priceUtils.js             # Turkish price string parser & comparator
│
├── pages/
│   ├── base/
│   │   └── BasePage.js           # Abstract base class for all page objects
│   ├── HomePage.js               # Grimelange homepage (nav, popup)
│   ├── ProductListPage.js        # Product listing page (sort, filter, select)
│   └── ProductDetailPage.js      # Product detail page (color, size, cart)
│
├── services/
│   └── UserService.js            # GoREST /users CRUD service layer
│
├── tests/
│   ├── ui/
│   │   └── grimelange.spec.js    # UI test spec (16 steps)
│   └── api/
│       └── gorest.spec.js        # API test spec (6 tests)
│
└── docs/
    ├── TECHNICAL_DOCUMENT_EN.md  # This document
    └── TECHNICAL_DOCUMENT_TR.md  # Turkish version
```

---

## 3. Technology Stack

| Tool / Library | Version | Purpose |
|----------------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| `@playwright/test` | Latest | Browser automation + API testing |
| `dotenv` | Latest | Loading `.env` environment variables |
| Chromium | Bundled | Test browser |

---

## 4. Architecture & Design Principles

### Page Object Model (POM)

Every web page under test is represented by a dedicated class. Tests only call high-level methods like `navigateToErkekPantolon()` or `addToCart()` — they never manipulate DOM selectors directly.

```
Test Spec  →  Page Object  →  BasePage utilities  →  Playwright API
```

### SOLID Principles

| Principle | Application in this project |
|-----------|---------------------------|
| **S**ingle Responsibility | Each class/file does exactly one thing: `locators.js` = selectors, `Logger` = logging, `priceUtils.js` = math, `UserService` = API calls |
| **O**pen / Closed | `BasePage` is open for extension (subclass it), closed for modification (never edit it for new pages) |
| **L**iskov Substitution | `HomePage`, `ProductListPage`, `ProductDetailPage` can all replace `BasePage` where only the base interface is used |
| **I**nterface Segregation | No page object carries methods it doesn't own — cart operations are only in `ProductDetailPage` |
| **D**ependency Inversion | `BasePage` depends on Playwright's `Page` interface; `UserService` depends on `APIRequestContext` — both are injected, never imported directly |

### DRY (Don't Repeat Yourself)

- Selectors written **once** in `constants/locators.js`
- Base URL written **once** in `config/config.js`
- Price parsing written **once** in `helpers/priceUtils.js`
- Common browser utilities written **once** in `pages/base/BasePage.js`

### Immutability

`Object.freeze()` is applied to `Config`, `Locators`, `URLs`, and `Logger` to prevent accidental mutation at runtime.

---

## 5. Layer Descriptions

### 5.1 `config/`

**`config.js`**

The single source of truth for all runtime configuration values. Loaded once; accessed everywhere via `require`.

```js
const Config = Object.freeze({
  ui:       { baseUrl: 'https://www.grimelange.com.tr' },
  api:      { baseUrl: 'https://gorest.co.in/public/v2', token: process.env.GOREST_TOKEN },
  timeouts: { short: 5_000, medium: 15_000, long: 30_000, highlight: 400 },
});
```

**Rule:** Never hard-code a URL or timeout in a page object or test spec. Always read from `Config`.

---

### 5.2 `constants/`

**`locators.js`**

A frozen, nested object holding every CSS selector used in the project, grouped by page/component. When the target website changes its DOM, only this file needs to be updated.

Each selector group uses an **array of fallback strings joined with `, `**, so Playwright matches whichever variant is present on the page:

```js
SORT_BUTTON: [
  'button:has-text("Sıralama")',
  'a:has-text("Sıralama")',
  'span:has-text("Sıralama")',
].join(', '),
```

**`urls.js`**

URL constants derived from `Config.ui.baseUrl`. Prevents hard-coded strings in page objects.

---

### 5.3 `helpers/`

**`highlight.js`**

Applies a yellow outline and semi-transparent background to any Playwright `Locator` before an interaction. Non-destructive — errors are silently swallowed so a missing element never fails the test due to highlighting.

```
outline: 3px solid yellow
background: rgba(255, 255, 0, 0.35)
```

**`logger.js`**

A frozen singleton object providing timestamped, levelled console output:

| Method | Prefix | Use case |
|--------|--------|----------|
| `Logger.step(n, msg)` | `[STEP N]` | Marks a numbered test step |
| `Logger.info(msg)` | `[INFO ]` | General trace output |
| `Logger.warn(msg)` | `[WARN ]` | Non-critical issues (e.g. no color options) |
| `Logger.error(msg)` | `[ERROR]` | Error conditions |

**`priceUtils.js`**

Handles Turkish locale number formatting:

| Function | Signature | Description |
|----------|-----------|-------------|
| `parsePrice` | `(str) → number` | Strips `₺`, converts `.`→thousands and `,`→decimal |
| `pricesMatch` | `(actual, expected, %) → boolean` | Tolerance-based price comparison (default 1% + 1₺ buffer) |

---

### 5.4 `pages/`

**`BasePage.js`** — Abstract base class

Provides all shared browser interaction utilities. All concrete page objects extend this class.

| Method | Description |
|--------|-------------|
| `goto(url)` | Navigate to URL, wait for DOMContentLoaded |
| `waitForDOMLoad()` | Wait for DOMContentLoaded |
| `waitForNetworkIdle()` | Wait for network idle |
| `waitForVisible(selector, timeout)` | Wait for a selector to be visible |
| `pause(ms)` | Wait a fixed number of milliseconds |
| `getLocator(selector)` | Returns `.first()` locator |
| `getLocatorAll(selector)` | Returns all matching locators |
| `highlightAndClick(locator)` | Highlight yellow → click |
| `highlightAndHover(locator)` | Highlight yellow → hover |
| `scrollIntoView(locator)` | Scroll element into viewport |
| `isVisible(locator)` | Safe visibility check (never throws) |

---

**`HomePage.js`**

| Responsibility | Methods |
|----------------|----------|
| Load homepage | `goto()` |
| Dismiss cookie/newsletter popup | `closePopup()` |
| Navigate to Erkek Pantolon (3-strategy fallback) | `navigateToErkekPantolon()` |

> **`navigateToErkekPantolon()` — Resilience Strategy**
>
> The method attempts three approaches in order, stopping as soon as one successfully lands on the Pantolon page:
>
> | Priority | Strategy | Trigger |
> |----------|----------|---------|
> | 1 | Hover ERKEK trigger → wait for mega-menu → click Pantolon sub-link | Standard hover-based menu |
> | 2 | Click ERKEK trigger → navigate to `/erkek-giyim` → click Pantolon link on the landing page | Click-based or non-hover menu |
> | 3 | Navigate directly to `/erkek-pantolon` URL | Guaranteed fallback regardless of menu behaviour |
>
> Each failed strategy logs a `[WARN]` with the reason and continues. The test only fails if all three strategies are exhausted.

---

**`ProductListPage.js`**

| Responsibility | Methods |
|----------------|---------|
| Check current page | `isOnPage(keyword)` |
| Select sort option | `selectSort(optionText)` |
| Read sort label | `getCurrentSortLabel()` |
| Apply a filter | `applyFilter(filterText)` |
| Click a random product | `clickRandomProduct()` → returns product name |

---

**`ProductDetailPage.js`**

| Responsibility | Methods |
|----------------|---------|
| Read product price | `getProductPrice()` |
| Select random color | `selectRandomColor()` |
| Select random size | `selectRandomSize()` |
| Add to cart | `clickAddToCart()` |
| Read cart popup price | `getCartPopupPrice()` |
| Increase quantity | `increaseQuantityByOne()` |
| Read quantity | `getCartPopupQuantity()` |
| Remove from cart | `removeProductFromCart()` |
| Check empty cart | `isCartEmpty()` → `boolean` |

---

### 5.5 `services/`

**`UserService.js`**

Encapsulates all HTTP calls to the GoREST `/users` endpoint. Receives the Playwright `APIRequestContext` via constructor injection (Dependency Inversion Principle).

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createUser(data)` | POST | `/public/v2/users` |
| `getAllUsers()` | GET | `/public/v2/users` |
| `getUserById(id)` | GET | `/public/v2/users/:id` |
| `updateUser(id, data)` | PUT | `/public/v2/users/:id` |
| `deleteUser(id)` | DELETE | `/public/v2/users/:id` |

All methods return the raw `APIResponse` — assertions remain in the test spec (separation of concerns).

---

### 5.6 `tests/`

Test files contain **only** test logic: step ordering, data preparation, and assertions. They do not contain selectors, URLs, or HTTP headers.

**`tests/ui/grimelange.spec.js`** — 1 test, 16 steps  
**`tests/api/gorest.spec.js`** — 6 sequential tests sharing state via `process.env`

#### Step isolation with `test.step()`

Every UI step is wrapped in a named `test.step()` block. This produces an individual entry in the HTML report for each step, making it easy to identify exactly which step failed without reading the full log.

```js
await test.step('3 - ERKEK menüsü → Pantolon', async () => {
  await home.navigateToErkekPantolon();
});
```

#### Hard vs. Soft assertions

| Assertion type | Playwright API | Behaviour on failure |
|----------------|---------------|---------------------|
| **Hard** (blocking) | `expect(...)` | Stops the current test immediately |
| **Soft** (non-blocking) | `expect.soft(...)` | Records the failure and continues to the next step |

Steps that use **soft** assertions (informational verifications — run continues):
- Step 4: URL / heading check after navigation
- Step 6: Sort label verification
- Step 8: Filter page verification
- Step 13: Popup price vs. product price comparison
- Step 15: Total price increase check

Steps that use **hard** assertions (blocking — run stops on failure):
- Step 14: Quantity increment (prerequisite for step 15)
- Step 16: Empty cart confirmation (final state verification)

---

## 6. Configuration

**`playwright.config.js`**

| Option | Value | Reason |
|--------|-------|--------|
| `headless` | `false` | Tests run visibly for demonstration |
| `video` | `'on'` | Full video recorded for every test |
| `screenshot` | `'on'` | Screenshots captured on each action |
| `trace` | `'on'` | Full Playwright trace for debugging |
| `retries` | `1` | Each failed test is automatically retried once before being marked failed; absorbs transient timing/network issues |
| `workers` | `1` | Sequential execution (tests share process.env state) |
| `locale` | `'tr-TR'` | Turkish locale for correct date/number formatting |
| `viewport` | `1440×900` | Desktop resolution |
| `timeout` | `90 000 ms` | Per-test timeout |
| `actionTimeout` | `20 000 ms` | Per-action timeout |
| `navigationTimeout` | `30 000 ms` | Per-navigation timeout |

---

## 7. Test Scenarios

### 7.1 UI — Grimelange

**File:** `tests/ui/grimelange.spec.js`

| Step | Action | Assertion | Type |
|------|--------|-----------|------|
| 1 | Navigate to `grimelange.com.tr` | — | — |
| 2 | Close cookie popup | — | — |
| 3 | Navigate to Erkek Pantolon (hover → click → direct URL) | — | — |
| 4 | — | URL / heading contains "pantolon" | Soft |
| 5 | Select sort: "Fiyata göre(artan)" | — | — |
| 6 | — | Sort label contains "artan" | Soft |
| 7 | Click filter → select "Kargo" | — | — |
| 8 | — | URL or heading contains "kargo" | Soft |
| 9 | Click a random product card | — | — |
| 10 | Select a random color swatch | — | — |
| 11 | Select a random available size | — | — |
| 12 | Click "Sepete Ekle" | Cart popup appears | Hard |
| 13 | — | Popup price ≈ product page price (±1%) | Soft |
| 14 | Click "+" to increase quantity | Quantity value incremented by 1 | Hard |
| 15 | — | Total price is higher than single-item price | Soft |
| 16 | Click remove button | Cart shows empty state | Hard |

---

### 7.2 API — GoREST

**File:** `tests/api/gorest.spec.js`  
**Base URL:** `https://gorest.co.in/public/v2`

| Test | Method | Endpoint | Assertion |
|------|--------|----------|-----------|
| 1 — Create user | POST | `/users` | Status 201; response `name` matches request body |
| 2 — Get all users | GET | `/users` | Status 200; response is a non-empty array |
| 3 — Get one user | GET | `/users/:id` | Status 200; `id`, `name`, `email` match created values |
| 4 — Update user | PUT | `/users/:id` | Status 200; updated `name`, `email`, `status` returned |
| 5 — Verify update | GET | `/users/:id` | Status 200; fields match values from test 4 |
| 6 — Delete user | DELETE | `/users/:id` | Status 204; subsequent GET returns 404 |

---

## 8. Running the Tests

```bash
# Install dependencies (first time only)
npm install
npx playwright install chromium

# Run all tests
npm test

# Run UI tests only
npm run test:ui

# Run API tests only
npm run test:api

# Run with visible browser (headed)
npm run test:headed

# Open the HTML report after a run
npm run report
```

---

## 9. Reports & Artifacts

All artifacts are written to the `test-results/` directory automatically.

| Artifact | Location | Description |
|----------|----------|-------------|
| HTML Report | `playwright-report/index.html` | Interactive test report |
| Video | `test-results/**/*.webm` | Full screen recording per test |
| Screenshot | `test-results/**/*.png` | Per-action screenshots |
| Trace | `test-results/**/*.zip` | Playwright trace viewer archive |

Open the trace with:
```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

---

## 10. Environment Setup

Create a `.env` file in the project root:

```
# GoREST API Bearer token
# Get yours at: https://gorest.co.in/my-account/access-tokens
GOREST_TOKEN=your_token_here
```

> **Security note:** Never commit `.env` to version control. Add it to `.gitignore`.

---

## 11. Dependency Graph

```
playwright.config.js
│
├── tests/ui/grimelange.spec.js
│   ├── pages/HomePage.js
│   │   ├── pages/base/BasePage.js
│   │   │   ├── helpers/highlight.js  ←── config/config.js
│   │   │   ├── helpers/logger.js
│   │   │   └── config/config.js
│   │   └── constants/locators.js
│   │       constants/urls.js  ←── config/config.js
│   ├── pages/ProductListPage.js     (same base chain)
│   ├── pages/ProductDetailPage.js   (same base chain)
│   ├── helpers/priceUtils.js
│   └── helpers/logger.js
│
└── tests/api/gorest.spec.js
    ├── services/UserService.js
    │   ├── config/config.js
    │   └── helpers/logger.js
    └── helpers/logger.js
```

Every leaf node ultimately depends on `config/config.js` as the single source of truth.
