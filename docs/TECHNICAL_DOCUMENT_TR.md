# Playwright JavaScript Test Otomasyon Çatısı — Teknik Belge

**Proje:** Grimelange UI + GoREST API Test Paketi  
**Dil:** JavaScript (Node.js)  
**Çatı:** Playwright (`@playwright/test`)  
**Desen:** Page Object Model (POM)  
**Prensipler:** SOLID, DRY, Ortam Değişkeni Tabanlı Yapılandırma  

---

## İçindekiler

1. [Projeye Genel Bakış](#1-projeye-genel-bakış)
2. [Klasör Yapısı](#2-klasör-yapısı)
3. [Teknoloji Yığını](#3-teknoloji-yığını)
4. [Mimari ve Tasarım Prensipleri](#4-mimari-ve-tasarım-prensipleri)
5. [Katman Açıklamaları](#5-katman-açıklamaları)
   - [config/](#51-config)
   - [constants/](#52-constants)
   - [helpers/](#53-helpers)
   - [pages/](#54-pages)
   - [services/](#55-services)
   - [specs/](#56-specs)
6. [Yapılandırma](#6-yapılandırma)
7. [Test Senaryoları](#7-test-senaryoları)
   - [UI — Grimelange](#71-ui--grimelange)
   - [API — GoREST](#72-api--gorest)
8. [Testleri Çalıştırma](#8-testleri-çalıştırma)
9. [Raporlar ve Artifactlar](#9-raporlar-ve-artifactlar)
10. [Ortam Kurulumu](#10-ortam-kurulumu)
11. [Bağımlılık Grafiği](#11-bağımlılık-grafiği)

---

## 1. Projeye Genel Bakış

Bu proje, **Playwright** kullanılarak **JavaScript** dilinde yazılmış tam otomatik bir test paketidir. İki ayrı test alanını kapsar:

| Alan | Hedef | Tür |
|------|-------|-----|
| UI   | [grimelange.com.tr](https://www.grimelange.com.tr) | Uçtan uca tarayıcı testi |
| API  | [gorest.co.in](https://gorest.co.in) | REST API servis testi |

Temel özellikler:
- **Page Object Model** — test edilen her sayfa kendi sınıfında kapsüllenir
- **Merkezi seçici kaydı** — tüm CSS seçiciler tek bir dosyada bulunur
- **SOLID tasarımı** — sınıfların tek bir sorumluluğu vardır ve somut uygulamalara değil soyutlamalara bağımlıdır
- **Video kaydı** — her test çalışması görsel kanıt için kayıt altına alınır
- **Sarı element vurgulaması** — etkileşime girilen her element görsel olarak vurgulanır
- **Dayanıklı navigasyon** — çok stratejili yedek mekanizması, sitenin menü etkileşim modeli değişse bile test çalıştırmanın devam etmesini sağlar
- **Yumuşak doğrulamalar** — kritik olmayan doğrulamalar çalışmayı durdurmadan raporlanır
- **Otomatik yeniden deneme** — başarısız testler başarısız olarak işaretlenmeden önce bir kez otomatik olarak yeniden çalıştırılır

---

## 2. Klasör Yapısı

```
Testinium/
│
├── .env                              # Kök şablon (tüm değişkenler)
├── .gitignore
│
├── docs/
│   ├── TECHNICAL_DOCUMENT_EN.md     # İngilizce teknik belge
│   └── TECHNICAL_DOCUMENT_TR.md     # Bu belge
│
├── api-tests/                        # ── Tamamen bağımsız API projesi ──
│   ├── .env                          # GOREST_TOKEN, API_BASE_URL
│   ├── package.json
│   ├── package-lock.json
│   ├── playwright.config.js
│   ├── config/
│   │   └── config.js                 # Tüm değerleri process.env'den okur
│   ├── helpers/
│   │   └── logger.js                 # Yapılandırılmış konsol kaydedicisi
│   ├── services/
│   │   └── UserService.js            # GoREST /users CRUD servis katmanı
│   └── specs/
│       └── gorest.spec.js            # API test dosyası (6 test)
│
└── ui-tests/                         # ── Tamamen bağımsız UI projesi ──
    ├── .env                          # UI_BASE_URL, TIMEOUT_*
    ├── package.json
    ├── package-lock.json
    ├── playwright.config.js
    ├── config/
    │   └── config.js                 # Tüm değerleri process.env'den okur
    ├── constants/
    │   └── urls.js                   # Yapılandırmadan türetilen sayfa URL'leri
    ├── helpers/
    │   ├── highlight.js              # Sarı element vurgulayıcı
    │   ├── logger.js                 # Yapılandırılmış konsol kaydedicisi
    │   └── priceUtils.js             # Türk fiyat ayrıştırıcı ve karşılaştırıcı
    ├── pages/
    │   ├── base/
    │   │   └── BasePage.js           # Tüm sayfa nesneleri için soyut taban sınıf
    │   ├── home/
    │   │   ├── HomePage.js           # Grimelange ana sayfası (nav, popup)
    │   │   └── HomePageLocators.js   # HomePage için tüm seçiciler
    │   ├── productList/
    │   │   ├── ProductListPage.js    # Listeleme sayfası (sıralama, filtreleme, seçim)
    │   │   └── ProductListPageLocators.js
    │   └── productDetail/
    │       ├── ProductDetailPage.js  # Detay sayfası (renk, beden, sepet)
    │       └── ProductDetailPageLocators.js
    └── specs/
        └── grimelange.spec.js        # UI test dosyası (14 adım)
```

---

## 3. Teknoloji Yığını

| Araç / Kütüphane | Sürüm | Amaç |
|------------------|-------|------|
| Node.js | ≥ 18 | Çalışma zamanı |
| `@playwright/test` | Güncel | Tarayıcı otomasyonu + API testi |
| `dotenv` | Güncel | `.env` ortam değişkenlerini yükleme |
| Chromium | Dahili | Test tarayıcısı |

---

## 4. Mimari ve Tasarım Prensipleri

### Page Object Model (POM)

Test altındaki her web sayfası, kendine özgü bir sınıfla temsil edilir. Testler yalnızca `navigateToErkekPantolon()` veya `addToCart()` gibi üst düzey metodları çağırır — DOM seçicileri doğrudan hiçbir zaman işlemezler.

```
Test Dosyası  →  Sayfa Nesnesi  →  BasePage Araçları  →  Playwright API
```

### SOLID Prensipleri

| Prensip | Bu projedeki uygulaması |
|---------|------------------------|
| **S**ingle Responsibility (Tek Sorumluluk) | Her sınıf/dosya tam olarak bir şey yapar: `locators.js` = seçiciler, `Logger` = kayıt, `priceUtils.js` = matematik, `UserService` = API çağrıları |
| **O**pen/Closed (Açık/Kapalı) | `BasePage` genişletmeye açık (alt sınıf oluşturulabilir), değişikliğe kapalıdır (yeni sayfalar için asla düzenlenmez) |
| **L**iskov Substitution (Yerine Geçme) | `HomePage`, `ProductListPage`, `ProductDetailPage` sınıflarının tamamı yalnızca taban arayüz kullanıldığında `BasePage`'in yerine geçebilir |
| **I**nterface Segregation (Arayüz Ayrımı) | Hiçbir sayfa nesnesi kendi işi olmayan metodları barındırmaz — sepet işlemleri yalnızca `ProductDetailPage`'de bulunur |
| **D**ependency Inversion (Bağımlılık Tersine Çevirme) | `BasePage`, Playwright'ın `Page` arayüzüne; `UserService`, `APIRequestContext` arayüzüne bağımlıdır — her ikisi de enjekte edilir, doğrudan içe aktarılmaz |

### DRY (Kendini Tekrar Etme)

- Seçiciler `constants/locators.js` içinde **yalnızca bir kez** yazılır
- Temel URL `config/config.js` içinde **yalnızca bir kez** yazılır
- Fiyat ayrıştırma `helpers/priceUtils.js` içinde **yalnızca bir kez** yazılır
- Ortak tarayıcı araçları `pages/base/BasePage.js` içinde **yalnızca bir kez** yazılır

### Değişmezlik (Immutability)

Çalışma zamanında yanlışlıkla değiştirilmeyi önlemek için `Config`, `Locators`, `URLs` ve `Logger` nesnelerine `Object.freeze()` uygulanmıştır.

---

## 5. Katman Açıklamaları

### 5.1 `config/`

**`config.js`**

Her iki projede de mevcuttur (`api-tests/` ve `ui-tests/`). Yerel `.env` dosyasını yüklemek için `require('dotenv').config()` çağrır, ardından dondurulmuş bir `Config` nesnesi sunar. Hiçbir değer sabit kodlanmaz.

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

**Kural:** Sayfa nesnesinde veya test dosyasında hiçbir zaman bir URL, zaman aşımı değeri veya token doğrudan yazılmaz. Her zaman `Config`'den okunur.

---

### 5.2 `constants/` *(yalnızca ui-tests)*

**`urls.js`**

`Config.ui.baseUrl`'den türetilen URL sabitleri. Sayfa nesnelerindeki sabit kodlanmış dizgileri önler.

```js
const URLs = Object.freeze({
  HOME:           Config.ui.baseUrl,
  ERKEK_GIYIM:   `${Config.ui.baseUrl}/erkek-giyim`,
  ERKEK_PANTOLON:`${Config.ui.baseUrl}/erkek-pantolon`,
});
```

---

### 5.3 `helpers/`

**`highlight.js`** *(yalnızca ui-tests)*

Bir etkileşimden önce herhangi bir Playwright `Locator`'a sarı çerçeve ve yarı saydam arka plan uygular. Yıkıcı değildir — hatalar sessizce yutulur, böylece eksik bir element vurgulama nedeniyle testi asla başarısız kılmaz.

```
outline: 3px solid yellow
background: rgba(255, 255, 0, 0.35)
```

**`logger.js`** *(her iki proje)*

Zaman damgalı, seviyelendirilmiş konsol çıktısı sağlayan dondurulmuş bir singleton nesnesi:

| Metod | Önek | Kullanım Amacı |
|-------|------|----------------|
| `Logger.step(n, msg)` | `[STEP N]` | Numaralı test adımını işaretler |
| `Logger.info(msg)` | `[INFO ]` | Genel izleme çıktısı |
| `Logger.warn(msg)` | `[WARN ]` | Kritik olmayan sorunlar (.örn. renk seçeneği yok) |
| `Logger.error(msg)` | `[ERROR]` | Hata durumları |

**`priceUtils.js`** *(yalnızca ui-tests)*

Türk yerel ayı sayı biçimlendirmesini işler:

| Fonksiyon | İmza | Açıklama |
|-----------|------|----------|
| `parsePrice` | `(str) → number` | `₺` kaldırır, `.`→binler ve `,`→ondalik dönüşümü yapar |
| `pricesMatch` | `(actual, expected, %) → boolean` | Tolerans tabanlı fiyat karşılaştırması (varsayılan %1 + 1₺ tampon) |

---

### 5.4 `pages/` *(yalnızca ui-tests)*

Her sayfa bir **ikili**dir: aynı alt klasörde bir sınıf dosyası ve birlikte konumlandırılmış bir seçici dosyası. Bu, seçicileri kullanan mantığın fiziksel olarak yanında tutar.

```
pages/
├── home/
│   ├── HomePage.js            ← davranış
│   └── HomePageLocators.js    ← seçiciler
├── productList/
│   ├── ProductListPage.js
│   └── ProductListPageLocators.js
└── productDetail/
    ├── ProductDetailPage.js
    └── ProductDetailPageLocators.js
```

**`*Locators.js` dosyaları**

Her locator dosyası, sayfasına ait tüm CSS seçicileri elemente göre gruplanmış şekilde tutan dondurulmuş bir nesnedir. Her seçici, `, ` ile birleştirilmiş **yedek dizi dizgilerinden** oluşur; böylece Playwright sayfada mevcut olan varyantı eşleştirir:

```js
PRODUCT_CARDS: [
  '.productItem.eachNot',
  '.productItem:not(.productItemVariantDetail)',
  '.productItem',
  '.listing-product',
].join(', '),
```

Hedef web sitesi DOM yapısını değiştirdiğinde yalnızca ilgili `*Locators.js` dosyasının güncellenmesi yeterlidir.

---

**`BasePage.js`** — Soyut taban sınıf

Pay laşılan tüm taıyıcı etkileşim araçlarını sağlar. Tüm somut sayfa nesneleri bu sınıfı miras alır.

| Metod | Açıklama |
|-------|----------|
| `goto(url)` | URL'ye git, DOMContentLoaded bekle |
| `waitForDOMLoad()` | DOMContentLoaded bekle |
| `waitForNetworkIdle()` | Yükleme durumunu bekle |
| `waitForVisible(selector, timeout)` | Seçicinin görünür olmasını bekle |
| `getLocator(selector)` | `.first()` locator döndürür |
| `getLocatorAll(selector)` | Eşleşen tüm locator'ları döndürür |
| `highlightAndClick(locator)` | Sarı vurgula → tıkla |
| `highlightAndHover(locator)` | Sarı vurgula → üzerine gel |
| `scrollIntoView(locator)` | Elementi görünür alana kaydır |
| `isVisible(locator)` | Güvenli görünürlük kontrolü (asla hata fırlatmaz) |

**`highlight.js`**

Bir etkileşimden önce herhangi bir Playwright `Locator`'a sarı çerçeve ve yarı saydam arka plan uygular. Yıkıcı değildir — hatalar sessizce yutulur, böylece eksik bir element vurgulama nedeniyle testi asla başarısız kılmaz.

```
outline: 3px solid yellow
background: rgba(255, 255, 0, 0.35)
```

**`logger.js`**

Zaman damgalı, seviyelendirilmiş konsol çıktısı sağlayan dondurulmuş bir singleton nesnesi:

| Metod | Önek | Kullanım Amacı |
|-------|------|----------------|
| `Logger.step(n, msg)` | `[STEP N]` | Numaralı test adımını işaretler |
| `Logger.info(msg)` | `[INFO ]` | Genel izleme çıktısı |
| `Logger.warn(msg)` | `[WARN ]` | Kritik olmayan sorunlar (örn. renk seçeneği yok) |
| `Logger.error(msg)` | `[ERROR]` | Hata durumları |

**`priceUtils.js`**

Türk yerel ayarı sayı biçimlendirmesini işler:

| Fonksiyon | İmza | Açıklama |
|-----------|------|----------|
| `parsePrice` | `(str) → number` | `₺` kaldırır, `.`→binler ve `,`→ondalık dönüşümü yapar |
| `pricesMatch` | `(actual, expected, %) → boolean` | Tolerans tabanlı fiyat karşılaştırması (varsayılan %1 + 1₺ tampon) |

---

### 5.4 `pages/`

**`BasePage.js`** — Soyut taban sınıf

Paylaşılan tüm tarayıcı etkileşim araçlarını sağlar. Tüm somut sayfa nesneleri bu sınıfı miras alır.

| Metod | Açıklama |
|-------|----------|
| `goto(url)` | URL'ye git, DOMContentLoaded bekle |
| `waitForDOMLoad()` | DOMContentLoaded bekle |
| `waitForNetworkIdle()` | Ağ boşta kalana bekle |
| `waitForVisible(selector, timeout)` | Seçicinin görünür olmasını bekle |
| `pause(ms)` | Belirtilen milisaniye kadar bekle |
| `getLocator(selector)` | `.first()` locator döndürür |
| `getLocatorAll(selector)` | Eşleşen tüm locator'ları döndürür |
| `highlightAndClick(locator)` | Sarı vurgula → tıkla |
| `highlightAndHover(locator)` | Sarı vurgula → üzerine gel |
| `scrollIntoView(locator)` | Elementi görünür alana kaydır |
| `isVisible(locator)` | Güvenli görünürlük kontrolü (asla hata fırlatmaz) |

---

**`HomePage.js`**

| Sorumluluk | Metodlar |
|------------|---------|
| Ana sayfayı yükle | `goto()` |
| Çerez/bülten popup'ını kapat | `closePopup()` |
| Erkek Pantolon sayfasına git (3 stratejili yedek) | `navigateToErkekPantolon()` |

> **`navigateToErkekPantolon()` — Dayanıklılık Stratejisi**
>
> Metot, Pantolon sayfasına başarıyla ulaşılır ulaşılmaz durarak üç yaklaşımı sırayla dener:
>
> | Öncelik | Strateji | Tetikleyici |
> |---------|----------|-------------|
> | 1 | ERKEK tetikleyicisi üzerine gel → mega-menünün açılmasını bekle → Pantolon alt bağlantısına tıkla | Standart hover tabanlı menü |
> | 2 | ERKEK tetikleyicisine tıkla → `/erkek-giyim` sayfasına git → açılan sayfadaki Pantolon bağlantısına tıkla | Tıklamaya dayalı veya hover'sız menü |
> | 3 | Doğrudan `/erkek-pantolon` URL'sine git | Menü davranışından bağımsız garantili yedek |
>
> Başarısız olan her strateji, nedeniyle birlikte `[WARN]` olarak günlüğe kaydedilir ve devam eder. Test yalnızca üç stratejinin tamamı tükendiğinde başarısız olur.

---

**`ProductListPage.js`**

| Sorumluluk | Metodlar |
|------------|---------|
| Mevcut sayfayı kontrol et | `isOnPage(keyword)` |
| Sıralama seçeneğini seç | `selectSort(optionText)` |
| Sıralama etiketini oku | `getCurrentSortLabel()` |
| Filtre uygula | `applyFilter(filterText)` |
| Rastgele ürüne tıkla | `clickRandomProduct()` → ürün adı döndürür |

---

**`ProductDetailPage.js`**

| Sorumluluk | Metodlar |
|------------|---------|
| Ürün fiyatını oku | `getProductPrice()` |
| Rastgele renk seç | `selectRandomColor()` |
| Rastgele beden seç | `selectRandomSize()` |
| Sepete ekle | `clickAddToCart()` |
| Sepet popup fiyatını oku | `getCartPopupPrice()` |
| Miktarı artır | `increaseQuantityByOne()` |
| Miktarı oku | `getCartPopupQuantity()` |
| Sepetten kaldır | `removeProductFromCart()` |
| Sepet boşluğunu kontrol et | `isCartEmpty()` → `boolean` |

---

### 5.5 `services/` *(yalnızca api-tests)*

**`UserService.js`**

GoREST `/users` endpoint'ine yapılan tüm HTTP çağrılarını kapsüller. Playwright `APIRequestContext`'i constructor enjeksiyonu yoluyla alır (Bağımlılık Tersine Çevirme Prensibi).

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `createUser(data)` | POST | `/public/v2/users` |
| `getAllUsers()` | GET | `/public/v2/users` |
| `getUserById(id)` | GET | `/public/v2/users/:id` |
| `updateUser(id, data)` | PUT | `/public/v2/users/:id` |
| `deleteUser(id)` | DELETE | `/public/v2/users/:id` |

Tüm metodlar ham `APIResponse` döndürür — doğrulamalar test dosyasında kalır (sorumlulukların ayrılması).

---

### 5.6 `specs/`

Test dosyaları **yalnızca** test mantığını barındırır: adım sıralaması, veri hazırlığı ve doğrulamalar. Seçici, URL veya HTTP başlıkları içermezler.

**`api-tests/specs/gorest.spec.js`** — `process.env` üzerinden durum paylaşan 6 sıralı test  
**`ui-tests/specs/grimelange.spec.js`** — 14 adlandırılmış `test.step()` bloğu olan 1 test

#### `test.step()` ile adım izolasyonu

Her UI adımı, adlandırılmış bir `test.step()` bloğuna sarılmıştır. Bu, HTML raporunda her adım için ayrı bir giriş oluşturur.

```js
await test.step('3 - ERKEK menüsü → Pantolon', async () => {
  await home.navigateToErkekPantolon();
});
```

#### Hard ve Soft Doğrulamalar

| Doğrulama türü | Playwright API | Başarısızlıkta davranış |
|----------------|---------------|------------------------|
| **Hard** (engelleyici) | `expect(...)` | Mevcut testi hemen durdurur |
| **Soft** (engelleyici değil) | `expect.soft(...)` | Başarısızlığı kaydeder ve bir sonraki adımla devam eder |

**Soft** doğrulama kullanan adımlar (bilgilendirici — çalışma devam eder):
- Adım 4: Navigasyon sonrası URL / başlık kontrolü
- Adım 6: Sıralama etiketi doğrulaması
- Adım 11: Popup fiyatı ile ürün fiyatı karşılaştırması
- Adım 13: Toplam fiyat artış kontrolü

**Hard** doğrulama kullanan adımlar (engelleyici):
- Adım 12: Miktar artışı (adım 13 için ön koşul)
- Adım 14: Boş sepet onayı (son durum doğrulaması)

---

## 6. Yapılandırma

Her alt projenin kendi `playwright.config.js` ve `.env` dosyası vardır.

**`api-tests/playwright.config.js`**

| Seçenek | Değer | Gerekçe |
|---------|-------|--------|
| `testDir` | `'./specs'` | Testler proje klasörü içindedir |
| `retries` | `1` | Geçici ağ sorunlarını tolere eder |
| `workers` | `1` | Sıralı çalıştırma (testler process.env durumunu paylaşır) |
| `outputDir` | `'./test-results/'` | Projeye özel |
| HTML raporu | `'./playwright-report'` | Projeye özel |

**`ui-tests/playwright.config.js`**

| Seçenek | Değer | Gerekçe |
|---------|-------|--------|
| `headless` | `false` | Testler gösterim için görünür biçimde çalışır |
| `video` | `'on'` | Her test için tam video kaydedilir |
| `screenshot` | `'on'` | Her eylemde ekran görüntüsü alınır |
| `trace` | `'on'` | Hata ayıklama için tam Playwright izi |
| `retries` | `1` | Geçici zamanlama/ağ sorunlarını tolere eder |
| `workers` | `1` | Sıralı çalıştırma |
| `locale` | `'tr-TR'` | Doğru sayı biçimlendirmesi için Türk yerel ayı |
| `viewport` | `1440×900` | Masaüstü çözünürlüğü |
| `timeout` | `90 000 ms` | Test başına zaman aşımı |
| `actionTimeout` | `20 000 ms` | Eylem başına zaman aşımı |
| `navigationTimeout` | `30 000 ms` | Navigasyon başına zaman aşımı |
| `outputDir` | `'./test-results/'` | Projeye özel |
| HTML raporu | `'./playwright-report'` | Projeye özel |

---

## 7. Test Senaryoları

### 7.1 UI — Grimelange

**Dosya:** `ui-tests/specs/grimelange.spec.js`

| Adım | Eylem | Doğrulama | Tür |
|------|-------|-----------|-----|
| 1 | `grimelange.com.tr`'ye git | — | — |
| 2 | Çerez popup'ını kapat | — | — |
| 3 | Erkek Pantolon'a git (nav tıkla → doğrudan URL yedeği) | — | — |
| 4 | — | URL / başlık "pantolon" içerir | Soft |
| 5 | Sıralama seç: "Fiyata göre(artan)" | — | — |
| 6 | — | Sıralama etiketi "artan" içerir | Soft |
| 7 | Rastgele bir ürün kartına tıkla | — | — |
| 8 | Rastgele renk çipi seç | — | — |
| 9 | Rastgele kullanılabilir beden seç | — | — |
| — | Ürün fiyatını detay sayfasından oku | — | — |
| 10 | "Sepete Ekle"ye tıkla | Sepet popup'ı görünür | Hard |
| 11 | — | Popup fiyatı ≈ ürün sayfası fiyatı (±%1) | Soft |
| 12 | Miktarı artırmak için "+"ya tıkla | Miktar değeri 1 artar | Hard |
| 13 | — | Toplam fiyat miktar artışından önce olandan yüksektir | Soft |
| 14 | Kaldır butonuna tıkla | Sepet boş durumu gösterir | Hard |

---

### 7.2 API — GoREST

**Dosya:** `api-tests/specs/gorest.spec.js`  
**Temel URL:** `https://gorest.co.in/public/v2`

| Test | Metod | Endpoint | Doğrulama |
|------|-------|----------|-----------|
| 1 — Kullanıcı oluştur | POST | `/users` | Durum 201; yanıttaki `name` istek gövdesiyle eşleşir |
| 2 — Tüm kullanıcıları getir | GET | `/users` | Durum 200; yanıt boş olmayan bir dizi |
| 3 — Tek kullanıcıyı getir | GET | `/users/:id` | Durum 200; `id`, `name`, `email` oluşturulan değerlerle eşleşir |
| 4 — Kullanıcıyı güncelle | PUT | `/users/:id` | Durum 200; güncellenmiş `name`, `email`, `status` döner |
| 5 — Güncellemeyi doğrula | GET | `/users/:id` | Durum 200; alanlar test 4'teki değerlerle eşleşir |
| 6 — Kullanıcıyı sil | DELETE | `/users/:id` | Durum 204; sonraki GET 404 döner |

---

## 8. Testleri Çalıştırma

Her proje kendi klasöründen bağımsız olarak çalıştırılır:

```bash
# ── API Testleri ──
cd api-tests
npm install
npx playwright install   # yalnızca ilk kez
npm test                 # tüm API testlerini çalıştır
npm run report           # HTML raporunu aç

# ── UI Testleri ──
cd ui-tests
npm install
npx playwright install chromium   # yalnızca ilk kez
npm test                          # UI testini çalıştır
npm run test:headed               # görünür taıyıcıyla çalıştır
npm run report                    # HTML raporunu aç
```

---

## 9. Raporlar ve Artifactlar

Artifactlar her projenin kendi klasörüne yazılır:

| Artifact | Konum | Açıklama |
|----------|-------|----------|
| HTML Raporu (API) | `api-tests/playwright-report/index.html` | Etkileşimli API test raporu |
| HTML Raporu (UI) | `ui-tests/playwright-report/index.html` | Etkileşimli UI test raporu |
| Video | `ui-tests/test-results/**/*.webm` | Test başına tam ekran kaydı |
| Ekran Görüntüsü | `ui-tests/test-results/**/*.png` | Eylem başına ekran görüntüleri |
| İz (Trace) | `ui-tests/test-results/**/*.zip` | Playwright trace viewer arşivi |

İzi şununla aç:
```bash
cd ui-tests
npx playwright show-trace test-results/<test-klasörü>/trace.zip
```

---

## 10. Ortam Kurulumu

Her alt projenin çalıştırılmadan önce oluşturulması gereken kendi `.env` dosyası vardır:

**`api-tests/.env`**
```
# GoREST API Bearer token'ı
# Token almak için: https://gorest.co.in/my-account/access-tokens
GOREST_TOKEN=senin_token_buraya
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

> **Güvenlik notu:** `.env` dosyalarını asla versiyon kontrolüne ekleme. `.gitignore` dosyasında listelenmektedirler.

---

## 11. Bağımlılık Grafiği

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
        ├── pages/productList/ProductListPage.js     (aynı taban zinciri)
        ├── pages/productDetail/ProductDetailPage.js (aynı taban zinciri)
        ├── helpers/priceUtils.js
        └── helpers/logger.js
```

Tüm değerler nihayetinde projenin `.env` dosyasından `config/config.js` aracılığıyla kaynaklanır.
