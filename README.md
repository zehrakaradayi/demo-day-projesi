# SkillSwap

> "Bildiğini paylaş. Yeni bir şey öğren. Doğru insanlarla tanış."

Beceri paylaşımı + okul dersleri + üniversite/bölüm rehberliği + sosyal eşleşme +
community'yi tek bir AI destekli sosyal öğrenme ağında birleştiren ürün.

Ürünün tam tanımı için bkz. [`docs/skillswap-master-brief-v2.pdf`](docs/skillswap-master-brief-v2.pdf)
(Master Ürün Brifi V2). Bu README, o brifi kod tabanına indirger.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — frontend + backend tek repoda
- **Tailwind CSS 4**
- **Prisma 7** (`@prisma/adapter-pg` ile PostgreSQL driver adapter) — veri modeli ve sorgular
- **Supabase** — Postgres barındırma + Auth (e-posta/OAuth), `@supabase/ssr` ile App Router entegrasyonu

## Klasör Yapısı

```
prisma/
  schema.prisma       Veri modeli (bkz. aşağıdaki "Veri Modeli" bölümü)
  seed.ts             Katalog verisi: skills, courses/topics, schools/departments
src/
  app/                Next.js route'ları (sayfa başına klasör)
  components/         Paylaşılan UI bileşenleri
  lib/
    prisma.ts         Prisma client singleton (driver adapter kurulu)
    supabase/         Supabase client'ları (browser / server / proxy)
  proxy.ts            Next.js Proxy (eski adıyla "middleware") — auth session yenileme
  generated/prisma/   Prisma'nın ürettiği client (gitignored, `npm run db:generate` ile oluşur)
docs/
  skillswap-master-brief-v2.pdf   Orijinal ürün brifi
```

### Route iskeleti (MVP)

Her route şu an bir placeholder (`PlaceholderPage`) render ediyor ve brifin ilgili
bölümüne referans veriyor — hangi ekranın hangi işi karşıladığını görmek için
`src/app/**/page.tsx` dosyalarını açman yeterli.

| Route | Brif bölümü | Açıklama |
|---|---|---|
| `/giris`, `/kayit` | Auth | Supabase Auth |
| `/onboarding` | 3 | Lifestyle Interview |
| `/kesfet` | 17 | Keşfet hub'ı (Türkiye/Global, filtreler) |
| `/skills` | 4 | Skill Exchange |
| `/dersler` | 4 | Okul dersleri / peer-learning |
| `/okullar`, `/okullar/[schoolId]`, `/okullar/[schoolId]/bolumler/[departmentId]` | 5 | Okul & Bölüm Ağı |
| `/eslesme` | 6, 17 | AI Match Engine sonuçları |
| `/sohbet`, `/sohbet/[conversationId]` | 8, 9 | Chat + AI özellikleri |
| `/meetup` | 9, 17 | AI Meetup Planner |
| `/profil` | 17 | Skill DNA, Passport, Guide profile, Trust |

## Veri Modeli

`prisma/schema.prisma`, brifin bölüm 20'sindeki veri modelini (School, Department,
UserEducation, GuideProfile, GuideSession, ContributionLedger) ve MVP kapsamındaki diğer
alanları (Lifestyle Interview, Skill/Course sistemi, Match, Chat, Block/Report) kapsar.

**Bilinçli olarak MVP dışı bırakılanlar:** Community sistemi, Skill DNA/Passport/Evolution,
Skill Chain, Missions/Gamification, Skill Stories — bunlar brifte V1/V2 kapsamında (bölüm 19).
Bu özelliklere gelindiğinde ilgili modeller şemaya eklenmeli.

> **Önemli (brifin notu):** Okul/bölüm özelliği ürünün temel parçalarından biri, sonradan
> eklenen bir eklenti değil. Yeni bir alan eklerken (profil, match, search, chat, session,
> passport, trust, contribution) okul/bölüm verisini nasıl etkileyeceğini düşün.

## Kurulum

1. **Supabase projesi oluştur:** [supabase.com](https://supabase.com) → New Project.
2. **`.env` dosyası oluştur:**
   ```bash
   cp .env.example .env
   ```
   Supabase panelinden şu değerleri doldur:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     → Project Settings → API
   - `DATABASE_URL` (pooler, port 6543), `DIRECT_URL` (direct, port 5432)
     → Project Settings → Database → Connection string
3. **Bağımlılıkları kur:**
   ```bash
   npm install
   ```
4. **Şemayı veritabanına uygula ve client'ı üret:**
   ```bash
   npm run db:push       # ilk kurulum / hızlı iterasyon için
   npm run db:generate
   npm run db:seed       # skills/courses/schools katalog verisini yükler
   ```
   Takım büyüdükçe ve şema stabilleştikçe `db:push` yerine `npm run db:migrate`
   (adlandırılmış migration'lar) kullanmaya geçin.
5. **Geliştirme sunucusunu başlat:**
   ```bash
   npm run dev
   ```

### Diğer komutlar

- `npm run db:studio` — Prisma Studio (veritabanını tarayıcıda incele)
- `npm run lint` — ESLint
- `npm run build` — production build

## Auth Notu

`User` tablosundaki `id`, Supabase Auth'taki `auth.users.id` ile birebir aynı olmalı.
Kayıt akışında: Supabase Auth'a kullanıcı oluştuktan sonra, dönen `user.id` ile
`prisma.user.create(...)` çağırarak profil satırını aynı id ile oluştur.

## Çalışma Şekli

Görev dağılımını ekip içinde belirleyeceğiz. Öneri: her kişi kendi alanı için bir
`feature/` branch'i açıp `main`'e PR ile birleştirsin (ör. `feature/auth-onboarding`,
`feature/skills-match`, `feature/okul-bolum-chat`). Ortak dosyalarda
(`prisma/schema.prisma`, `src/lib/**`) çakışma riski yüksek olduğundan model/şema
değişikliklerini küçük PR'larla ve haber vererek yapmak işe yarar.
