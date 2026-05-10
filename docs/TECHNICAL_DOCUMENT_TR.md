# Playwright JavaScript Test Otomasyon Çatısı — Teknik Belge

**Proje:** Grimelange UI + GoREST API Test Paketi  
**Dil:** JavaScript (Node.js)  
**Çatı:** Playwright (`@playwright/test`)  
**Desen:** Page Object Model (POM)  
**Prensipler:** SOLID, DRY, Tek Kaynak İlkesi  

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
   - [tests/](#56-tests)
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
├── .env                          # Ortam değişkenleri (token, gizli anahtarlar)
├── playwright.config.js          # Playwright global yapılandırması
├── package.json                  # npm komutları ve bağımlılıklar
│
├── config/
│   └── config.js                 # Merkezi uygulama yapılandırması (URL'ler, zaman aşımları, token)
│
├── constants/
│   ├── locators.js               # Tüm CSS/metin seçiciler (tek kaynak)
│   └── urls.js                   # Yapılandırmadan türetilen tüm sayfa URL'leri
│
├── helpers/
│   ├── highlight.js              # Sarı element vurgulayıcı
│   ├── logger.js                 # Yapılandırılmış konsol kaydedicisi
│   └── priceUtils.js             # Türk fiyat dizgisi ayrıştırıcı ve karşılaştırıcı
│
├── pages/
│   ├── base/
│   │   └── BasePage.js           # Tüm sayfa nesneleri için soyut taban sınıf
│   ├── HomePage.js               # Grimelange ana sayfası (navigasyon, popup)
│   ├── ProductListPage.js        # Ürün listeleme sayfası (sıralama, filtreleme, seçim)
│   └── ProductDetailPage.js      # Ürün detay sayfası (renk, beden, sepet)
│
├── services/
│   └── UserService.js            # GoREST /users CRUD servis katmanı
│
├── tests/
│   ├── ui/
│   │   └── grimelange.spec.js    # UI test dosyası (16 adım)
│   └── api/
│       └── gorest.spec.js        # API test dosyası (6 test)
│
└── docs/
    ├── TECHNICAL_DOCUMENT_EN.md  # İngilizce teknik belge
    └── TECHNICAL_DOCUMENT_TR.md  # Bu belge
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

Tüm çalışma zamanı yapılandırma değerleri için tek kaynak. Bir kez yüklenir; her yerden `require` ile erişilir.

```js
const Config = Object.freeze({
  ui:       { baseUrl: 'https://www.grimelange.com.tr' },
  api:      { baseUrl: 'https://gorest.co.in/public/v2', token: process.env.GOREST_TOKEN },
  timeouts: { short: 5_000, medium: 15_000, long: 30_000, highlight: 400 },
});
```

**Kural:** Sayfa nesnesinde veya test dosyasında hiçbir zaman bir URL ya da zaman aşımı değeri doğrudan yazılmaz. Her zaman `Config`'den okunur.

---

### 5.2 `constants/`

**`locators.js`**

Projede kullanılan her CSS seçiciyi, sayfa/bileşene göre gruplanmış şekilde tutan dondurulmuş, iç içe bir nesnedir. Hedef web sitesi DOM yapısını değiştirdiğinde yalnızca bu dosyanın güncellenmesi yeterlidir.

Her seçici grubu, `, ` ile birleştirilmiş **yedek dizi dizgilerinden** oluşur; böylece Playwright sayfada mevcut olan varyantı eşleştirir:

```js
SORT_BUTTON: [
  'button:has-text("Sıralama")',
  'a:has-text("Sıralama")',
  'span:has-text("Sıralama")',
].join(', '),
```

**`urls.js`**

`Config.ui.baseUrl`'den türetilen URL sabitleri. Sayfa nesnelerindeki sabit kodlanmış dizgileri önler.

---

### 5.3 `helpers/`

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

### 5.5 `services/`

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

### 5.6 `tests/`

Test dosyaları **yalnızca** test mantığını barındırır: adım sıralaması, veri hazırlığı ve doğrulamalar. Seçici, URL veya HTTP başlıkları içermezler.

**`tests/ui/grimelange.spec.js`** — 1 test, 16 adım  
**`tests/api/gorest.spec.js`** — `process.env` üzerinden durum paylaşan 6 sıralı test

#### `test.step()` ile adım izolasyonu

Her UI adımı, adlandırılmış bir `test.step()` bloğuna sarılmıştır. Bu, HTML raporunda her adım için ayrı bir giriş oluşturur; tüm günlüğü okumadan tam olarak hangi adımın başarısız olduğunu kolayca tespit etmeyi sağlar.

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

**Soft** doğrulama kullanan adımlar (bilgilendirici doğrulamalar — çalışma devam eder):
- Adım 4: Navigasyon sonrası URL / başlık kontrolü
- Adım 6: Sıralama etiketi doğrulaması
- Adım 8: Filtre sayfası doğrulaması
- Adım 13: Popup fiyatı ile ürün fiyatı karşılaştırması
- Adım 15: Toplam fiyat artış kontrolü

**Hard** doğrulama kullanan adımlar (engelleyici — başarısızlıkta çalışma durur):
- Adım 14: Miktar artışı (adım 15 için ön koşul)
- Adım 16: Boş sepet onayı (son durum doğrulaması)

---

## 6. Yapılandırma

**`playwright.config.js`**

| Seçenek | Değer | Gerekçe |
|---------|-------|---------|
| `headless` | `false` | Testler gösterim için görünür biçimde çalışır |
| `video` | `'on'` | Her test için tam video kaydedilir |
| `screenshot` | `'on'` | Her eylemde ekran görüntüsü alınır |
| `trace` | `'on'` | Hata ayıklama için tam Playwright izi || `retries` | `1` | Başarısız testler başarısız olarak işaretlenmeden önce otomatik olarak bir kez yeniden çalıştırılır; geçici zamanlama/ağ sorunlarını tolere eder || `workers` | `1` | Sıralı çalıştırma (testler process.env durumunu paylaşır) |
| `locale` | `'tr-TR'` | Doğru tarih/sayı biçimlendirmesi için Türk yerel ayarı |
| `viewport` | `1440×900` | Masaüstü çözünürlüğü |
| `timeout` | `90 000 ms` | Test başına zaman aşımı |
| `actionTimeout` | `20 000 ms` | Eylem başına zaman aşımı |
| `navigationTimeout` | `30 000 ms` | Navigasyon başına zaman aşımı |

---

## 7. Test Senaryoları

### 7.1 UI — Grimelange

**Dosya:** `tests/ui/grimelange.spec.js`

| Adım | Eylem | Doğrulama | Tür |
|------|-------|-----------|-----|
| 1 | `grimelange.com.tr`'ye git | — | — |
| 2 | Çerez popup'ını kapat | — | — |
| 3 | Erkek Pantolon'a git (hover → tıkla → doğrudan URL) | — | — |
| 4 | — | URL / başlık "pantolon" içerir | Soft |
| 5 | Sıralama seç: "Fiyata göre(artan)" | — | — |
| 6 | — | Sıralama etiketi "artan" içerir | Soft |
| 7 | Filtreleme tıkla → "Kargo" seç | — | — |
| 8 | — | URL veya başlık "kargo" içerir | Soft |
| 9 | Rastgele bir ürün kartına tıkla | — | — |
| 10 | Rastgele renk çipi seç | — | — |
| 11 | Rastgele kullanılabilir beden seç | — | — |
| 12 | "Sepete Ekle"ye tıkla | Sepet popup'ı görünür | Hard |
| 13 | — | Popup fiyatı ≈ ürün sayfası fiyatı (±%1) | Soft |
| 14 | Miktarı artırmak için "+"ya tıkla | Miktar değeri 1 artar | Hard |
| 15 | — | Toplam fiyat tek ürün fiyatından yüksektir | Soft |
| 16 | Kaldır butonuna tıkla | Sepet boş durumu gösterir | Hard |

---

### 7.2 API — GoREST

**Dosya:** `tests/api/gorest.spec.js`  
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

```bash
# Bağımlılıkları yükle (yalnızca ilk kez)
npm install
npx playwright install chromium

# Tüm testleri çalıştır
npm test

# Yalnızca UI testlerini çalıştır
npm run test:ui

# Yalnızca API testlerini çalıştır
npm run test:api

# Görünür tarayıcıyla çalıştır (headed)
npm run test:headed

# Çalıştırma sonrası HTML raporunu aç
npm run report
```

---

## 9. Raporlar ve Artifactlar

Tüm artifactlar otomatik olarak `test-results/` dizinine yazılır.

| Artifact | Konum | Açıklama |
|----------|-------|----------|
| HTML Raporu | `playwright-report/index.html` | Etkileşimli test raporu |
| Video | `test-results/**/*.webm` | Test başına tam ekran kaydı |
| Ekran Görüntüsü | `test-results/**/*.png` | Eylem başına ekran görüntüleri |
| İz (Trace) | `test-results/**/*.zip` | Playwright trace viewer arşivi |

İzi şununla aç:
```bash
npx playwright show-trace test-results/<test-klasörü>/trace.zip
```

---

## 10. Ortam Kurulumu

Proje kök dizininde bir `.env` dosyası oluştur:

```
# GoREST API Bearer token'ı
# Token almak için: https://gorest.co.in/my-account/access-tokens
GOREST_TOKEN=senin_token_buraya
```

> **Güvenlik notu:** `.env` dosyasını asla versiyon kontrolüne ekleme. `.gitignore` dosyasına ekle.

---

## 11. Bağımlılık Grafiği

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
│   ├── pages/ProductListPage.js     (aynı taban zinciri)
│   ├── pages/ProductDetailPage.js   (aynı taban zinciri)
│   ├── helpers/priceUtils.js
│   └── helpers/logger.js
│
└── tests/api/gorest.spec.js
    ├── services/UserService.js
    │   ├── config/config.js
    │   └── helpers/logger.js
    └── helpers/logger.js
```

Her yaprak düğüm nihayetinde tek kaynak olarak `config/config.js`'e bağımlıdır.
