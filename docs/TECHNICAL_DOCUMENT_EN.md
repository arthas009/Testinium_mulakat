# Playwright JavaScript Test Automation Framework — Technical Document

**Project:** Grimelange UI + GoREST API Test Suite  
**Language:** JavaScript (Node.js)  
**Framework:** Playwright (`@playwright/test`)  
**Pattern:** Page Object Model (POM)  
**Principles:** SOLID, DRY, Environment-driven Configuration  

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
   - [specs/](#56-specs)
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

This project is a fully automated test suite built with **Playwright** in **JavaScript**. It is structured as **two completely independent sub-projects**, each with its own dependencies, configuration, and environment variables:

| Sub-project | Domain | Target | Type |
|-------------|--------|--------|------|
| `api-tests/` | API | [gorest.co.in](https://gorest.co.in) | REST API service test |
| `ui-tests/`  | UI  | [grimelange.com.tr](https://www.grimelange.com.tr) | End-to-end browser test |

Key characteristics:
- **Fully independent projects** — each sub-project has its own `package.json`, `.env`, `playwright.config.js`, and `node_modules`
- **Page Object Model** — each page/component is encapsulated in its own class
- **Co-located locator files** — each page class has a paired `*Locators.js` file in the same folder
- **Environment-driven config** — all URLs, timeouts, and tokens are read from `.env`; nothing is hardcoded
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
├── .env                              # Root env template (all variables)
├── .gitignore
│
├── docs/
│   ├── TECHNICAL_DOCUMENT_EN.md     # This document
│   └── TECHNICAL_DOCUMENT_TR.md     # Turkish version
│
├── api-tests/                        # ── Fully independent API project ──
│   ├── .env                          # GOREST_TOKEN, API_BASE_URL
│   ├── package.json
│   ├── package-lock.json
│   ├── playwright.config.js
│   ├── config/
│   │   └── config.js                 # Reads all values from process.env
│   ├── helpers/
│   │   └── logger.js                 # Structured console logger
│   ├── services/
│   │   └── UserService.js            # GoREST /users CRUD service layer
│   └── specs/
│       └── gorest.spec.js            # API test spec (6 tests)
│
└── ui-tests/                         # ── Fully independent UI project ──
    ├── .env                          # UI_BASE_URL, TIMEOUT_*
    ├── package.json
    ├── package-lock.json
    ├── playwright.config.js
    ├── config/
    │   └── config.js                 # Reads all values from process.env
    ├── constants/
    │   └── urls.js                   # Page URLs derived from config
    ├── helpers/
    │   ├── highlight.js              # Yellow element highlighter
    │   ├── logger.js                 # Structured console logger
    │   └── priceUtils.js             # Turkish price parser & comparator
    ├── pages/
    │   ├── base/
    │   │   └── BasePage.js           # Abstract base class for all page objects
    │   ├── home/
    │   │   ├── HomePage.js           # Grimelange homepage (nav, popup)
    │   │   └── HomePageLocators.js   # All selectors for HomePage
    │   ├── productList/
    │   │   ├── ProductListPage.js    # Listing page (sort, filter, select)
    │   │   └── ProductListPageLocators.js
    │   └── productDetail/
    │       ├── ProductDetailPage.js  # Detail page (color, size, cart)
    │       └── ProductDetailPageLocators.js
    └── specs/
        └── grimelange.spec.js        # UI test spec (14 steps)
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
| **S**ingle Responsibility | Each class/file does exactly one thing: `*Locators.js` = selectors, `Logger` = logging, `priceUtils.js` = math, `UserService` = API calls |
| **O**pen / Closed | `BasePage` is open for extension (subclass it), closed for modification (never edit it for new pages) |
| **L**iskov Substitution | `HomePage`, `ProductListPage`, `ProductDetailPage` can all replace `BasePage` where only the base interface is used |
| **I**nterface Segregation | No page object carries methods it doesn't own — cart operations are only in `ProductDetailPage` |
| **D**ependency Inversion | `BasePage` depends on Playwright's `Page` interface; `UserService` depends on `APIRequestContext` — both are injected, never imported directly |

### DRY (Don't Repeat Yourself)

- Selectors written **once** in each page's co-located `*Locators.js` file
- Base URL written **once** in `.env` and read via `Config`
- Timeouts written **once** in `.env` and read via `Config.timeouts`
- Price parsing written **once** in `helpers/priceUtils.js`
- Common browser utilities written **once** in `pages/base/BasePage.js`

### Immutability

`Object.freeze()` is applied to `Config`, `URLs`, and `Logger` to prevent accidental mutation at runtime.

### Environment-driven Configuration

All runtime values (base URLs, timeouts, API tokens) live exclusively in `.env` files. `config.js` in each project reads from `process.env` and exposes a frozen `Config` object. No values are hardcoded in source files.

---

## 5. Layer Descriptions

### 5.1 `config/`

**`config.js`**

Present in both `api-tests/` and `ui-tests/`. Calls `require('dotenv').config()` to load the local `.env`, then exposes a frozen `Config` object. No values are hardcoded.

**`ui-tests/config/config.js`:**
```js
const Config = Object.freeze({
  ui:       { baseUrl: process.env.UI_BASE_URL },
  timeouts: {
    short:     Number(process.env.TIMEOUT_SHORT),
    medium:    Number(process.env.TIMEOUT_MEDIUM),
    long:      Number(process.env.TIMEOUT_LONG),
    highlight: Number(process.env.TIMEOUT_HIGHLIGHT),
  },
});
```

**`api-tests/config/config.js`:**
```js
const Config = Object.freeze({
  api: {
    baseUrl: process.env.API_BASE_URL,
    token:   process.env.GOREST_TOKEN,
  },
});
```

**Rule:** Never hard-code a URL, timeout, or token in a page object or test spec. Always read from `Config`.

---

### 5.2 `constants/` *(ui-tests only)*

**`urls.js`**

URL constants derived from `Config.ui.baseUrl`. Prevents hard-coded strings in page objects.

```js
const URLs = Object.freeze({
  HOME:           Config.ui.baseUrl,
  ERKEK_GIYIM:   `${Config.ui.baseUrl}/erkek-giyim`,
  ERKEK_PANTOLON:`${Config.ui.baseUrl}/erkek-pantolon`,
});
```

---

### 5.3 `helpers/`

**`highlight.js`** *(ui-tests only)*

Applies a yellow outline and semi-transparent background to any Playwright `Locator` before an interaction. Non-destructive — errors are silently swallowed so a missing element never fails the test due to highlighting.

```
outline: 3px solid yellow
background: rgba(255, 255, 0, 0.35)
```

**`logger.js`** *(both projects)*

A frozen singleton object providing timestamped, levelled console output:

| Method | Prefix | Use case |
|--------|--------|----------|
| `Logger.step(n, msg)` | `[STEP N]` | Marks a numbered test step |
| `Logger.info(msg)` | `[INFO ]` | General trace output |
| `Logger.warn(msg)` | `[WARN ]` | Non-critical issues (e.g. no color options) |
| `Logger.error(msg)` | `[ERROR]` | Error conditions |

**`priceUtils.js`** *(ui-tests only)*

Handles Turkish locale number formatting:

| Function | Signature | Description |
|----------|-----------|-------------|
| `parsePrice` | `(str) → number` | Strips `₺`, converts `.`→thousands and `,`→decimal |
| `pricesMatch` | `(actual, expected, %) → boolean` | Tolerance-based price comparison (default 1% + 1₺ buffer) |

---

### 5.4 `pages/` *(ui-tests only)*

Each page is a **duo**: one class file and one co-located locator file in the same sub-folder. This keeps selectors physically next to the logic that uses them.

```
pages/
├── home/
│   ├── HomePage.js            ← behavior
│   └── HomePageLocators.js    ← selectors
├── productList/
│   ├── ProductListPage.js
│   └── ProductListPageLocators.js
└── productDetail/
    ├── ProductDetailPage.js
    └── ProductDetailPageLocators.js
```

**`*Locators.js` files**

Each locator file is a frozen object holding all CSS selectors for its page, grouped by element. Each selector uses an **array of fallback strings joined with `, `**, so Playwright matches whichever variant is present on the page:

```js
PRODUCT_CARDS: [
  '.productItem.eachNot',
  '.productItem:not(.productItemVariantDetail)',
  '.productItem',
  '.listing-product',
].join(', '),
```

When the target website changes its DOM, only the relevant `*Locators.js` file needs to be updated.

---

**`BasePage.js`** — Abstract base class

Provides all shared browser interaction utilities. All concrete page objects extend this class.

| Method | Description |
|--------|-------------|
| `goto(url)` | Navigate to URL, wait for DOMContentLoaded |
| `waitForDOMLoad()` | Wait for DOMContentLoaded |
| `waitForNetworkIdle()` | Wait for load state |
| `waitForVisible(selector, timeout)` | Wait for a selector to be visible |
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
| Navigate to Erkek Pantolon (2-strategy fallback) | `navigateToErkekPantolon()` |

> **`navigateToErkekPantolon()` — Resilience Strategy**
>
> | Priority | Strategy | Trigger |
> |----------|----------|---------|
> | 1 | Click ERKEK nav link → land on `/erkek-giyim` → click Pantolon link on the page | Standard navigation |
> | 2 | Navigate directly to `/erkek-pantolon` URL | Guaranteed fallback regardless of menu behaviour |

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

### 5.5 `services/` *(api-tests only)*

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

### 5.6 `specs/`

Test files contain **only** test logic: step ordering, data preparation, and assertions. They do not contain selectors, URLs, or HTTP headers.

**`api-tests/specs/gorest.spec.js`** — 6 sequential tests sharing state via `process.env`  
**`ui-tests/specs/grimelange.spec.js`** — 1 test with 14 named `test.step()` blocks

#### Step isolation with `test.step()`

Every UI step is wrapped in a named `test.step()` block. This produces an individual entry in the HTML report for each step, making it easy to identify exactly which step failed.

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

Steps that use **soft** assertions (informational — run continues):
- Step 4: URL / heading check after navigation
- Step 6: Sort label verification
- Step 11: Popup price vs. product price comparison
- Step 13: Total price increase check

Steps that use **hard** assertions (blocking):
- Step 12: Quantity increment (prerequisite for step 13)
- Step 14: Empty cart confirmation (final state verification)

---

## 6. Configuration

Each sub-project has its own `playwright.config.js` and `.env`.

**`api-tests/playwright.config.js`**

| Option | Value | Reason |
|--------|-------|--------|
| `testDir` | `'./specs'` | Specs live inside the project folder |
| `retries` | `1` | Absorbs transient network issues |
| `workers` | `1` | Sequential (tests share process.env state) |
| `outputDir` | `'./test-results/'` | Local to the project |
| HTML report | `'./playwright-report'` | Local to the project |

**`ui-tests/playwright.config.js`**

| Option | Value | Reason |
|--------|-------|--------|
| `headless` | `false` | Tests run visibly for demonstration |
| `video` | `'on'` | Full video recorded for every test |
| `screenshot` | `'on'` | Screenshots captured on each action |
| `trace` | `'on'` | Full Playwright trace for debugging |
| `retries` | `1` | Absorbs transient timing/network issues |
| `workers` | `1` | Sequential execution |
| `locale` | `'tr-TR'` | Turkish locale for correct number formatting |
| `viewport` | `1440×900` | Desktop resolution |
| `timeout` | `90 000 ms` | Per-test timeout |
| `actionTimeout` | `20 000 ms` | Per-action timeout |
| `navigationTimeout` | `30 000 ms` | Per-navigation timeout |
| `outputDir` | `'./test-results/'` | Local to the project |
| HTML report | `'./playwright-report'` | Local to the project |

---

## 7. Test Scenarios

### 7.1 UI — Grimelange

**File:** `ui-tests/specs/grimelange.spec.js`

| Step | Action | Assertion | Type |
|------|--------|-----------|------|
| 1 | Navigate to `grimelange.com.tr` | — | — |
| 2 | Close cookie popup | — | — |
| 3 | Navigate to Erkek Pantolon (click nav → direct URL fallback) | — | — |
| 4 | — | URL / heading contains "pantolon" | Soft |
| 5 | Select sort: "Fiyata göre(artan)" | — | — |
| 6 | — | Sort label contains "artan" | Soft |
| 7 | Click a random product card | — | — |
| 8 | Select a random color swatch | — | — |
| 9 | Select a random available size | — | — |
| — | Read product price from detail page | — | — |
| 10 | Click "Sepete Ekle" | Cart popup appears | Hard |
| 11 | — | Popup price ≈ product page price (±1%) | Soft |
| 12 | Click "+" to increase quantity | Quantity value incremented by 1 | Hard |
| 13 | — | Total price is higher than before quantity increase | Soft |
| 14 | Click remove button | Cart shows empty state | Hard |

---

### 7.2 API — GoREST

**File:** `api-tests/specs/gorest.spec.js`  
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

Each project is run independently from its own folder:

```bash
# ── API Tests ──
cd api-tests
npm install
npx playwright install   # first time only
npm test                 # run all API tests
npm run report           # open HTML report

# ── UI Tests ──
cd ui-tests
npm install
npx playwright install chromium   # first time only
npm test                          # run UI test
npm run test:headed               # run with visible browser
npm run report                    # open HTML report
```

Alternatively, from the project root using the root scripts:

```bash
npm run test:api
npm run test:ui
npm run test:ui:headed
npm run report:api
npm run report:ui
```

---

## 9. Reports & Artifacts

Artifacts are written inside each project's own folder:

| Artifact | Location | Description |
|----------|----------|-------------|
| HTML Report (API) | `api-tests/playwright-report/index.html` | Interactive API test report |
| HTML Report (UI) | `ui-tests/playwright-report/index.html` | Interactive UI test report |
| Video | `ui-tests/test-results/**/*.webm` | Full screen recording per test |
| Screenshot | `ui-tests/test-results/**/*.png` | Per-action screenshots |
| Trace | `ui-tests/test-results/**/*.zip` | Playwright trace viewer archive |

Open the trace with:
```bash
cd ui-tests
npx playwright show-trace test-results/<test-folder>/trace.zip
```

---

## 10. Environment Setup

Each sub-project has its own `.env` file. Create them before running:

**`api-tests/.env`**
```
# GoREST API Bearer token
# Get yours at: https://gorest.co.in/my-account/access-tokens
GOREST_TOKEN=your_token_here
API_BASE_URL=https://gorest.co.in/public/v2
```

**`ui-tests/.env`**
```
UI_BASE_URL=https://www.grimelange.com.tr
TIMEOUT_SHORT=5000
TIMEOUT_MEDIUM=15000
TIMEOUT_LONG=30000
TIMEOUT_HIGHLIGHT=400
```

> **Security note:** Never commit `.env` files to version control. They are listed in `.gitignore`.

---

## 11. Dependency Graph

```
api-tests/
└── playwright.config.js
    └── specs/gorest.spec.js
        ├── services/UserService.js
        │   ├── config/config.js  ←── .env (GOREST_TOKEN, API_BASE_URL)
        │   └── helpers/logger.js
        └── helpers/logger.js

ui-tests/
└── playwright.config.js
    └── specs/grimelange.spec.js
        ├── pages/home/HomePage.js
        │   ├── pages/base/BasePage.js
        │   │   ├── helpers/highlight.js
        │   │   ├── helpers/logger.js
        │   │   └── config/config.js  ←── .env (UI_BASE_URL, TIMEOUT_*)
        │   ├── pages/home/HomePageLocators.js
        │   └── constants/urls.js  ←── config/config.js
        ├── pages/productList/ProductListPage.js     (same base chain)
        ├── pages/productDetail/ProductDetailPage.js (same base chain)
        ├── helpers/priceUtils.js
        └── helpers/logger.js
```

All values ultimately originate from the project's `.env` file via `config/config.js`.
