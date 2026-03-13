# Scrollr MVP — Implementation Plan + Content Safety Strategy

---

## PART 1: CONTENT SAFETY & RISK MITIGATION

### The Problem

Scrollr lets anyone sign up, upload video, and distribute content to a public feed. This creates real risks:

| Risk Category | Examples | Severity |
|---|---|---|
| **Sexual / NSFW content** | Nudity, pornography, suggestive content targeting minors | CRITICAL |
| **Violence / Gore** | Graphic injury, animal cruelty, real-world attacks | CRITICAL |
| **Child safety (CSAM)** | Any content exploiting minors | CRITICAL — legal liability |
| **Hate speech** | Racial slurs, symbols, targeted harassment | HIGH |
| **Dangerous activities** | Self-harm tutorials, drug manufacturing, weapons | HIGH |
| **Scam / Fraud** | Fake products, counterfeit goods, phishing links | HIGH |
| **Spam / Bot abuse** | Mass-uploading low-quality content to game the algorithm | MEDIUM |
| **Copyright infringement** | Re-uploading brand/creator content without permission | MEDIUM |
| **Misinformation** | Fake medical claims, dangerous product claims | MEDIUM |

### How Other Platforms Handle This (for reference)

| Platform | Pre-publish moderation? | AI scanning? | Human review? | Post limits? |
|---|---|---|---|---|
| **TikTok** | Yes (queue before live) | Yes (frame + audio) | Yes (10,000+ moderators) | Soft limits via shadowban |
| **Instagram Reels** | No (post-publish scan) | Yes | Yes | No hard limits |
| **YouTube Shorts** | No (post-publish scan) | Yes (Content ID) | Yes | No hard limits |
| **Shopify** | Merchant responsible | No | No | N/A |

### Our Strategy: Defense in Depth (5 Layers)

---

#### LAYER 1: Rate Limiting (Posting Caps)

Prevents spam/abuse by limiting upload volume per user.

```
FREE plan:
  - 3 videos per day
  - 10 videos per week
  - Max video duration: 60 seconds
  - Max file size: 100 MB

CREATOR plan:
  - 10 videos per day
  - 50 videos per week
  - Max video duration: 3 minutes
  - Max file size: 500 MB

PRO plan:
  - 25 videos per day
  - 100 videos per week
  - Max video duration: 10 minutes
  - Max file size: 2 GB
```

**Implementation:** Add `maxVideosPerDay`, `maxVideosPerWeek`, `maxDurationSeconds`, `maxFileSizeMB` to `PLAN_LIMITS`. Check counts in the upload API before allowing new uploads.

---

#### LAYER 2: Pre-Publish AI Moderation (Already Partially Built)

**What exists:** `lib/moderation.ts` — OpenAI Vision scans thumbnail frames after Cloudflare processing.

**What to add:**
- **Text moderation** — Scan video titles, descriptions, and product names through OpenAI Moderation API (free endpoint)
- **Audio transcription check** — Use Cloudflare Stream's auto-generated captions (or Whisper) to scan spoken content
- **Hold-for-review queue** — Videos flagged with confidence 0.5–0.85 go to manual review instead of auto-reject
- **Immediate rejection** — Confidence > 0.85 → auto-reject with reason sent to creator

**Flow:**
```
Upload → Cloudflare processes → Webhook fires →
  1. Extract 6 frames at intervals
  2. OpenAI Vision scans each frame
  3. OpenAI Moderation API checks title/description
  4. Score < 0.5 → APPROVED (auto-publish)
  5. Score 0.5–0.85 → PENDING_REVIEW (held)
  6. Score > 0.85 → REJECTED (auto-reject, notify creator)
```

---

#### LAYER 3: User Reporting System (New)

Let viewers flag content. This is how real violations get caught post-publish.

**Report reasons:**
- Sexual content
- Violence or dangerous acts
- Hate speech or harassment
- Spam or misleading
- Scam or fraud
- Involves a minor
- Copyright violation
- Other

**Implementation:**
- New `Report` model in Prisma (reporter, videoId, reason, status)
- API endpoint: `POST /api/videos/[id]/report`
- Auto-hide threshold: 3+ unique reports → video hidden pending review
- Reporter cooldown: max 10 reports per day per user (prevent abuse of reporting)

---

#### LAYER 4: Account Trust & Verification

New accounts are the highest risk. Graduated trust model:

| Account Age | Trust Level | Capabilities |
|---|---|---|
| 0–24 hours | **New** | 1 video/day, all videos held for review |
| 1–7 days | **Basic** | Plan limits apply, AI moderation only |
| 7–30 days | **Established** | Full plan limits, AI moderation only |
| 30+ days, 0 strikes | **Trusted** | Relaxed moderation, priority processing |

**Strike system:**
- 1st violation → Warning + content removed
- 2nd violation → 7-day upload ban
- 3rd violation → 30-day upload ban
- 4th violation → Permanent ban

Store `trustLevel`, `strikeCount`, `lastStrikeAt` on the User model.

---

#### LAYER 5: Admin Moderation Dashboard (New)

Platform operators need to review flagged content.

**Features:**
- Queue of videos pending review (sorted by report count, severity)
- One-click approve / reject / ban user
- View report history per user
- View moderation log (who approved/rejected what)
- Stats: videos reviewed today, rejection rate, avg review time

**Implementation:**
- New admin role on User model (`role: USER | ADMIN`)
- Protected `/admin` routes
- API endpoints for moderation actions

---

### Content Policy Summary (What We Ban)

| Category | Policy | Detection Method |
|---|---|---|
| Nudity / Sexual | Zero tolerance | AI frame scan |
| CSAM | Zero tolerance + law enforcement report | AI + PhotoDNA hash (future) |
| Violence / Gore | Zero tolerance for graphic content | AI frame scan |
| Hate speech | Zero tolerance | AI text + frame scan |
| Self-harm | Zero tolerance | AI text + frame scan |
| Drugs | Context-dependent (educational OK) | AI scan → human review |
| Scams | Zero tolerance | User reports + manual review |
| Spam | Rate limits + auto-detection | Posting caps + duplicate detection |
| Copyright | DMCA takedown process | User reports |

---

## PART 2: IMPLEMENTATION PLAN (What to Build)

### Phase 1: Safety & Rate Limiting (Priority — Build First)

| # | Task | Files to Change/Create |
|---|---|---|
| 1.1 | Add posting rate limits to `PLAN_LIMITS` | `lib/planLimits.ts` |
| 1.2 | Create `canUploadVideo()` function (check daily/weekly counts) | `lib/planLimits.ts` |
| 1.3 | Enforce limits in upload API | `app/api/upload/presign/route.ts` |
| 1.4 | Add text moderation (title/description) via OpenAI Moderation API | `lib/moderation.ts` |
| 1.5 | Add `Report` model to Prisma schema | `prisma/schema.prisma` |
| 1.6 | Create report API endpoint | `app/api/videos/[id]/report/route.ts` |
| 1.7 | Add report button to VideoSlide component | `components/feed/VideoSlide.tsx` |
| 1.8 | Add trust level + strike fields to User model | `prisma/schema.prisma` |
| 1.9 | Implement graduated trust checks in upload flow | `lib/planLimits.ts`, upload API |
| 1.10 | Show remaining upload quota in dashboard | `app/(dashboard)/dashboard/page.tsx` |

### Phase 2: Admin Panel

| # | Task | Files to Change/Create |
|---|---|---|
| 2.1 | Add `role` field to User model | `prisma/schema.prisma` |
| 2.2 | Create admin layout + middleware | `app/(admin)/layout.tsx`, `middleware.ts` |
| 2.3 | Build moderation queue page | `app/(admin)/admin/moderation/page.tsx` |
| 2.4 | Build reported content review page | `app/(admin)/admin/reports/page.tsx` |
| 2.5 | Create admin API endpoints (approve/reject/ban) | `app/api/admin/` |
| 2.6 | Add moderation log table | `prisma/schema.prisma` |

### Phase 3: Remaining MVP Features

| # | Task | Description |
|---|---|---|
| 3.1 | Search functionality | Search videos/products/creators |
| 3.2 | Category filtering | Browse by category on discover page |
| 3.3 | Creator earnings dashboard | View commissions, payout history |
| 3.4 | Email notifications | Order confirmation, moderation notices (via Resend) |
| 3.5 | Shopify app install flow | OAuth flow for merchants to connect stores |
| 3.6 | Refund/return handling | Sync refunds from Shopify back to Scrollr |

### Phase 4: Growth & Polish

| # | Task | Description |
|---|---|---|
| 4.1 | Mobile responsiveness audit | Ensure feed works perfectly on all devices |
| 4.2 | SEO + Open Graph tags | Creator profiles shareable on social |
| 4.3 | Onboarding flow | Guide new creators through setup |
| 4.4 | Performance optimization | Lazy loading, image optimization, caching |
| 4.5 | Error boundaries + offline handling | Graceful error states |

---

## PART 3: RISK ASSESSMENT SUMMARY

### Legal Risks

| Risk | Mitigation |
|---|---|
| **CSAM liability** (Section 230 doesn't protect) | AI scanning + mandatory reporting to NCMEC |
| **DMCA takedowns** | Implement DMCA agent + takedown process |
| **Product liability** (dangerous products sold) | Shopify merchant is responsible; Scrollr is marketplace |
| **FTC compliance** (affiliate disclosures) | Auto-add "Paid partnership" label on tagged videos |

### Business Risks

| Risk | Mitigation |
|---|---|
| Platform becomes spam-filled | Rate limits + AI moderation + trust levels |
| Creators upload copyrighted content | DMCA process + user reports |
| Low-quality content floods feed | Recommendation algorithm already scores engagement |
| Chargebacks from fraudulent orders | Shopify handles payments; Scrollr only facilitates |

### Technical Risks

| Risk | Mitigation |
|---|---|
| OpenAI moderation costs scale with uploads | Cache results, use free Moderation API for text |
| False positives block legitimate creators | Human review queue for borderline cases |
| Rate limit bypass via multiple accounts | IP-based rate limiting + phone verification (future) |

---

## Recommended Build Order

**Start with Phase 1 (Safety)** — this protects the platform from day one. Then Phase 2 (Admin) so you can manually review edge cases. Phase 3 and 4 are feature growth once the foundation is safe.

Want me to start building Phase 1?
