# Testinium Interview – Playwright Test Suite

End-to-end and API test project built with [Playwright](https://playwright.dev/) for the Testinium interview assignment.

---

## Repository Structure

```
Testinium/
├── api-tests/          # GoREST REST API test suite
│   ├── config/         # Config loader (reads from .env)
│   ├── helpers/        # Logger utility
│   ├── services/       # UserService (CRUD wrappers for /users endpoint)
│   └── specs/          # Test cases (gorest.spec.js)
│
├── ui-tests/           # Grimelange e-commerce UI test suite
│   ├── config/         # Config loader (reads from .env)
│   ├── constants/      # URL constants
│   ├── helpers/        # Logger, price parser, element highlighter
│   ├── pages/          # Page Object Model
│   │   ├── base/       # BasePage – shared Playwright utilities
│   │   ├── home/       # HomePage + locators
│   │   ├── productList/# ProductListPage + locators
│   │   └── productDetail/ # ProductDetailPage + locators
│   └── specs/          # Test cases (grimelange.spec.js)
│
└── docs/               # Technical documentation (TR / EN)
```

---

## Quick Start

Each project is self-contained. Install dependencies and run tests separately.

### API Tests

```bash
cd api-tests
npm install
npx playwright test
```

### UI Tests

```bash
cd ui-tests
npm install
npx playwright test             # headless (default: false, runs with browser visible)
npx playwright test --headed    # explicit headed mode
npx playwright show-report playwright-report   # open HTML report
```

---

## Why `dotenv`?

Both projects use [`dotenv`](https://www.npmjs.com/package/dotenv) to load configuration from a `.env` file at runtime instead of hardcoding values in source code.

**Benefits:**
- **No secrets in code** — API tokens, base URLs, and timeouts stay out of the repository and are never accidentally pushed.
- **Environment flexibility** — switching between environments (dev, staging, prod) is a single `.env` change, not a code change.
- **Single source of truth** — `config/config.js` is the only file that reads env vars; the rest of the codebase imports `Config` and never touches `process.env` directly.

```
# api-tests/.env
API_BASE_URL=https://gorest.co.in/public/v2
GOREST_TOKEN=your_token_here

# ui-tests/.env
UI_BASE_URL=https://www.grimelange.com.tr
TIMEOUT_SHORT=3000
TIMEOUT_MEDIUM=8000
TIMEOUT_LONG=15000
TIMEOUT_HIGHLIGHT=300
```

---

## Locator Strategy

### Why comma-separated multi-selector fallbacks?

```js
PRODUCT_PRICE: [
  'span.discountPriceSpan',
  '.discountPriceSpan',
  '.discountPrice .discountPriceSpan',
].join(', ')
```

E-commerce sites like Grimelange frequently change their CSS class names across deployments. Using a **ranked list of selectors joined by commas** means Playwright resolves the first one that exists in the DOM — so tests keep passing even if the primary selector breaks.

The selectors are ordered from **most specific → least specific**:
1. Most specific (exact class + element) — matched when the current structure exists.
2. Less specific fallback — matched after minor DOM restructuring.
3. Contextual fallback — matched when the element moves inside a different parent.

### Why no XPath or text-based selectors as primary?

- XPath is brittle against structural changes.
- Text-based selectors (`has-text`) are locale-sensitive and break when copy changes.
- CSS class selectors match the site's actual styling intent — classes like `discountPriceSpan` are semantic, not positional.

### Why `filter({ visible: true })` for color/size options?

Out-of-stock sizes and unavailable colors are present in the DOM but hidden. Filtering by visibility prevents clicking invisible/disabled options, which would cause the test to fail for the wrong reason.

---

## Element Highlighting

Every interaction is preceded by a **yellow highlight** on the target element:

```js
// helpers/highlight.js
el.style.outline         = '3px solid yellow';
el.style.backgroundColor = 'rgba(255, 255, 0, 0.35)';
```

This is wired into `BasePage.highlightAndClick()` and `highlightAndHover()`, so all page objects get it automatically. It makes interactions clearly visible in **video recordings and traces**, which helps reviewers follow test execution step by step.

---

## API Test Design

### Why `test.describe.serial`?

The API tests form a **stateful CRUD chain**: create → read → update → verify → delete. Each test case depends on the user created by TC-1.

Using `test.describe.serial`:
- Guarantees all tests run **sequentially in the same worker**.
- Allows shared state via a **closure-scoped `let` variable** (`createdUserId`) instead of `process.env`, which is a global side-effect and unreliable across workers.

### Test Cases

| ID | Endpoint | Assertion |
|----|----------|-----------|
| TC-1 | `POST /users` | Status 201; response `name` matches request body |
| TC-2 | `GET /users` | Status 200; response is a non-empty array |
| TC-3 | `GET /users/:id` | Status 200; `id`, `name`, `email` match created user |
| TC-4 | `PUT /users/:id` | Status 200; updated fields reflected in response |
| TC-5 | `GET /users/:id` | Status 200; independent re-fetch confirms update persisted |
| TC-6 | `DELETE /users/:id` | Status 204; subsequent GET returns 404 |

---

## UI Test Design

### Test Scenario — Erkek Pantolon → Sepete Ekle → Doğrulama

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | Navigate to homepage | — |
| 2 | Dismiss cookie/popup dialog | — |
| 3 | Navigate to Erkek Pantolon via menu (with URL fallback) | — |
| 4 | Verify correct page | URL contains `pantolon`; heading matches |
| 5 | Sort by "Fiyata göre (artan)" | — |
| 6 | Verify sort label updated | Label contains `artan` |
| 7 | Select a random product | — |
| 8 | Select a random color (skipped if none available) | — |
| 9 | Select a random size | — |
| 10 | Click "Sepete Ekle" | Cart popup appears |
| 11 | Compare cart popup price with product page price | Prices match within ±1% tolerance |
| 12 | Increase quantity by 1 | Quantity counter increments |
| 13 | Verify grand total increased | Total after > total before |
| 14 | Remove product from cart | Cart becomes empty |

### Why ±1% price tolerance?

Turkish e-commerce sites sometimes apply rounding at checkout (e.g. VAT breakdown differs by display context). A rigid `===` equality would cause false failures. The `pricesMatch()` helper in `helpers/priceUtils.js` accepts a configurable tolerance (default 1%) plus a ±1 TL flat margin to handle these display discrepancies.

### Navigation Fallback Strategy

The "ERKEK → Pantolon" path uses two strategies:
1. **Menu click** — hover ERKEK, navigate to `/erkek-giyim`, click the Pantolon link.
2. **Direct URL** — navigate straight to `/erkek-pantolon` if the menu link is absent (e.g. due to A/B testing or layout changes).

This prevents flaky failures caused by dynamic navigation menus.

---

## Playwright Configuration Highlights

| Setting | API Tests | UI Tests | Reason |
|---------|-----------|----------|--------|
| `workers` | 1 | 1 | Sequential dependency chain |
| `fullyParallel` | false | false | Same reason |
| `retries` | 1 | 1 | Handle transient network/UI flakiness |
| `headless` | — | false | Visual verification; yellow highlight visible |
| `video` | — | on | Review test run after failure |
| `trace` | — | on | Full action/network trace for debugging |
| `locale` | — | tr-TR | Correct Turkish price/date formatting |

---

## Tech Stack

- [Playwright](https://playwright.dev/) `^1.59`
- [dotenv](https://www.npmjs.com/package/dotenv) `^17`
- Node.js (CommonJS modules)
- GoREST public API (`https://gorest.co.in/public/v2`)
- Grimelange (`https://www.grimelange.com.tr`)
