# Content Management

## Overview

Content management is available at `/admin/content`. Admins can view, filter, publish/unpublish, and delete all video content on the platform.

## Features

### Search & Filter
- Text search across video title, description, and creator name/email
- Status filter: All, Ready, Processing, Pending Review, Rejected, Error
- Paginated results (20 per page)

### Content Table
Each video row shows:
- Thumbnail preview
- Title and category
- Duration
- Creator name and email
- Status badge (READY, PROCESSING, PENDING_REVIEW, REJECTED, ERROR)
- Published status (Live badge)
- Report count (highlighted red if > 0)
- Tagged product count
- Creation date

### Actions

#### Publish / Unpublish
- Toggle video visibility in the feed
- Publish: Sets status to READY, published to true
- Unpublish: Sets status to REJECTED, published to false

#### Delete
- Permanently removes the video
- Requires confirmation (click Delete, then Confirm)
- Creates a ModerationLog entry before deletion
- Cascades to: video products, events, reports, moderation logs, saved items, video score

## Content Moderation Queue

The moderation queue at `/admin/moderation` shows videos with `PENDING_REVIEW` status:

- Videos flagged by AI moderation (confidence 0.5-0.85)
- Videos from NEW trust level users
- Videos with 3+ user reports

Actions:
- **Approve** — Publish the video
- **Reject** — Remove from platform
- **Ban User** — Reject + apply strike to creator

## Reports Dashboard

The reports dashboard at `/admin/reports` shows user-submitted reports:
- Grouped by video
- Shows report reason and reporter
- Actions: Dismiss report, Remove video, Ban user

## API Reference

### GET /api/admin/content
Query params: `page`, `pageSize`, `search`, `status`

### DELETE /api/admin/videos/{id}
Permanently deletes a video with moderation log.

### PATCH /api/admin/moderation/{id}
Body: `{ "action": "approve|reject|ban_user", "reason?": "..." }`
