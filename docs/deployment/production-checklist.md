# Production Checklist

Pre-launch verification steps for deploying Scrollr to production.

## Infrastructure

- [ ] PostgreSQL database provisioned and accessible
- [ ] All environment variables set (see [Environment Variables](./environment-variables.md))
- [ ] Prisma migrations applied (`npx prisma migrate deploy`)
- [ ] Domain configured with SSL
- [ ] CDN configured for static assets

## Authentication

- [ ] Supabase project created with correct redirect URLs
- [ ] Google OAuth configured in Supabase dashboard
- [ ] Email templates customized in Supabase
- [ ] At least one ADMIN user created in the database

## Payments

- [ ] Stripe account in live mode
- [ ] Stripe webhook endpoint registered and verified
- [ ] Stripe Connect onboarding flow tested
- [ ] Test transaction completed end-to-end

## Video

- [ ] Cloudflare Stream account active
- [ ] Stream webhook registered
- [ ] Upload presigning working
- [ ] HLS playback verified on mobile and desktop

## Shopify

- [ ] Shopify app created in Partner Dashboard
- [ ] OAuth redirect URLs configured
- [ ] Webhook endpoints registered
- [ ] Product sync tested with real store
- [ ] Order creation tested

## Content Safety

- [ ] OpenAI API key configured and working
- [ ] Moderation thresholds reviewed
- [ ] ADMIN user has access to moderation queue
- [ ] Report system tested
- [ ] Strike escalation logic verified

## Monitoring

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Webhook delivery monitoring active
- [ ] Database query performance monitored
- [ ] Cron jobs scheduled (video scores, trust level updates)

## Legal

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent implemented
- [ ] DMCA takedown process documented
- [ ] Music licensing policy communicated to creators
