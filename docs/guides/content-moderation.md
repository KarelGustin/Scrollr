# Content Moderation

Scrollr implements a 5-layer defense system for content safety.

## Layer 1: Trust-Based Upload Limits

New users have restricted upload capabilities based on their trust level:

| Trust Level | Account Age | Upload Limit | Review Policy |
|-------------|-------------|-------------|---------------|
| NEW | 0-24 hours | 1 video/day | All held for manual review |
| BASIC | 1-7 days | Per plan limits | Standard moderation |
| ESTABLISHED | 7-30 days | Full plan limits | Relaxed |
| TRUSTED | 30+ days, 0 strikes | Full limits | Auto-approve |

Implementation: `lib/planLimits.ts`

## Layer 2: AI Pre-Publish Moderation

Before any video goes live, it passes through automated AI moderation:

1. **Frame Extraction**: 6 frames sampled from the video
2. **Visual Analysis**: OpenAI Vision API analyzes frames for:
   - Sexual content / nudity
   - Violence / gore
   - Hate symbols
   - Drug content
   - Minors in inappropriate contexts
3. **Text Analysis**: Title and description checked via OpenAI Moderation API

### Confidence Thresholds
- **> 0.85**: Auto-reject (clear violation)
- **0.5 - 0.85**: Hold for manual review (PENDING_REVIEW)
- **< 0.5**: Auto-approve (safe content)

Implementation: `lib/moderation.ts`

## Layer 3: User Reporting

Any authenticated user can report a video with specific reasons:
- SEXUAL_CONTENT, VIOLENCE, HATE_SPEECH, SPAM, SCAM, INVOLVES_MINOR, COPYRIGHT, SELF_HARM, OTHER

**Auto-hide threshold**: Videos with 3+ reports are automatically hidden from the feed pending admin review.

Endpoint: `POST /api/videos/[id]/report`

## Layer 4: Admin Manual Review

Admins can access the moderation queue at `/admin/moderation` to:
- **Approve** — Set status to READY, publish video
- **Reject** — Set status to REJECTED, unpublish
- **Ban User** — Reject video + apply strike to uploader

All actions are logged in the `ModerationLog` table.

## Layer 5: Strike System

Escalating consequences for violations:

| Strike # | Consequence |
|-----------|------------|
| 1st | Warning + content removed |
| 2nd | 7-day upload ban |
| 3rd | 30-day upload ban |
| 4th+ | Permanent ban |

Admins can:
- Apply strikes manually
- Reset strike counts
- Ban/unban users directly
- Delete users entirely

## Content Management (Admin)

The admin panel at `/admin/content` provides:
- Full content listing with search and status filtering
- Publish/unpublish toggle
- Delete with confirmation
- Report count visibility
- Creator attribution

See [Admin Panel](../admin/admin-panel.md) for full admin capabilities.
