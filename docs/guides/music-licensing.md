# Music & Copyright Guide

## The Problem

Using copyrighted music in videos on Scrollr can result in:
- **DMCA takedown notices** — Legal requirement to remove infringing content
- **Platform liability** — Scrollr can lose safe harbor protections if not responsive
- **Creator account penalties** — Repeat offenders face strikes and bans
- **Lawsuits** — Major labels actively enforce copyright through litigation
- **Content removal** — Videos with copyrighted music will be removed

## Copyright Rules for Creators

### What You CANNOT Do
- Use songs from Spotify, Apple Music, or any streaming service in your videos
- Use popular songs without a license (even short clips)
- Use "no copyright" music from YouTube without verifying the actual license
- Assume "fair use" covers commercial content (Scrollr videos are commercial — they sell products)

### What You CAN Do
- Use **royalty-free music** from licensed libraries
- Use **Creative Commons** music (with proper attribution)
- Use **original music** you created or commissioned
- Use music from **licensed stock libraries** with a valid commercial license
- Use **public domain** music (pre-1928 compositions, but not modern recordings)

## Recommended Music Sources

### Royalty-Free Libraries (Paid)
These libraries offer music safe for commercial use in videos:

| Service | Price Range | Notes |
|---------|------------|-------|
| Epidemic Sound | $15-49/mo | Largest library, TikTok/YouTube integration |
| Artlist | $15-25/mo | Unlimited downloads, simple licensing |
| Musicbed | Per-track | Higher-end, cinematic music |
| Soundstripe | $15-25/mo | Good variety, affordable |
| Uppbeat | Free tier available | Free with attribution option |

### Free Options
| Source | License | Requirements |
|--------|---------|-------------|
| YouTube Audio Library | Royalty-free | Some require attribution |
| Free Music Archive | Creative Commons | Check individual track licenses |
| Pixabay Music | Content license | Free for commercial use |
| Incompetech | CC BY 4.0 | Credit the artist |

### Creative Commons Licenses
| License | Commercial Use | Modification | Attribution |
|---------|---------------|-------------|-------------|
| CC0 | Yes | Yes | No |
| CC BY | Yes | Yes | Yes |
| CC BY-SA | Yes | Yes, share-alike | Yes |
| CC BY-NC | **NO** | Yes | Yes |
| CC BY-ND | Yes | **NO** | Yes |

**Important**: CC BY-NC (Non-Commercial) is NOT allowed on Scrollr because the platform is commercial (selling products).

## Platform Recommendations for Scrollr

### Current Implementation
Scrollr should implement the following protections:

1. **DMCA Safe Harbor Compliance**
   - Maintain a designated DMCA agent
   - Respond to takedown notices within 24-48 hours
   - Implement counter-notification process
   - Publish DMCA policy in Terms of Service

2. **Creator Education**
   - Display music licensing guidelines during upload
   - Require creators to confirm music rights before publishing
   - Include copyright information in creator onboarding

3. **Reporting System** (Already Implemented)
   - COPYRIGHT report reason is available in the reporting system
   - Admin review queue handles copyright reports
   - Strike system penalizes repeat offenders

### Future Enhancements (Recommended)

4. **Audio Detection Integration**
   - Integrate content identification (e.g., Audible Magic, YouTube Content ID API)
   - Flag videos with detected copyrighted audio before publishing
   - Auto-reject or hold for review

5. **Built-in Music Library**
   - Partner with a royalty-free music provider (Epidemic Sound, Artlist)
   - Offer licensed music directly in the upload flow
   - Removes the burden from creators

6. **Platform-Level Licensing**
   - Like TikTok and Instagram, negotiate blanket licenses with major labels
   - This is expensive but eliminates copyright risk for creators
   - Requires significant user base to justify cost

## Legal Requirements

### DMCA Safe Harbor (Section 512)
To maintain safe harbor protection, Scrollr must:
1. Register a DMCA agent with the U.S. Copyright Office
2. Publish the agent's contact information on the website
3. Adopt and implement a repeat infringer policy (strike system)
4. Respond expeditiously to valid takedown notices
5. Not have actual knowledge of infringing activity
6. Not financially benefit directly from infringement they could control

### Takedown Process
1. Rights holder sends DMCA notice identifying the infringing content
2. Scrollr removes or disables access to the content
3. Scrollr notifies the creator
4. Creator can submit a counter-notification if they believe it's a mistake
5. If counter-notification received, content restored after 10-14 business days (unless rights holder files lawsuit)

## Action Items for Scrollr

### Immediate (Before Launch)
- [ ] Add copyright checkbox to video upload flow
- [ ] Add music licensing section to Terms of Service
- [ ] Publish DMCA policy page
- [ ] Register DMCA agent

### Short-term (Post-Launch)
- [ ] Add in-app music licensing guidelines
- [ ] Implement audio fingerprinting for uploaded videos
- [ ] Create creator education content about copyright

### Long-term (Scale)
- [ ] Partner with royalty-free music provider
- [ ] Explore blanket licensing deals
- [ ] Build in-app music selection tool
