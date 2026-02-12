# TikTok Shop App Review — Submission Materials

## App Overview

**Gawain** is an AI-powered video generation service for TikTok Shop sellers. It automatically creates professional product promotional videos using product catalog data (titles, images, prices), reducing the time and cost of video content creation for e-commerce sellers.

## Target Users

TikTok Shop sellers who want to:
- Generate promotional videos for their product listings automatically
- Reduce video production costs and turnaround time
- Increase product engagement through video content on their storefront

## Data Flow

1. **Authorization**: Seller authorizes Gawain via TikTok Shop OAuth 2.0 flow
2. **Token Storage**: OAuth tokens are encrypted with AES-256-GCM and stored server-side in SQLite
3. **Product Fetch**: Gawain fetches product data (title, images, price) via TikTok Shop Product API
4. **Video Generation**: Product data is sent to Gawain's GPU-powered video generation pipeline
5. **Delivery**: Generated video is stored on CDN and made available to the seller
6. **Deployment**: Seller can optionally deploy the video to their TikTok Shop storefront widget
7. **Disconnection**: Seller can disconnect at any time, immediately deleting all stored tokens

## Data Collected and Purpose

| Data | Purpose | Retention |
|------|---------|-----------|
| OAuth access_token | API calls to TikTok Shop on seller's behalf | While connected (encrypted) |
| OAuth refresh_token | Refresh expired access tokens | While connected (encrypted) |
| Open ID | Identify the connected seller account | While connected (encrypted) |
| Product title, images, price | Input for AI video generation | Transient (not stored) |
| Generated videos | Deliverable to seller | Until seller deletes |

See [Privacy Policy](/privacy) and [Permissions](../permissions.md) for full details.

## Data Deletion Methods

1. **Self-service**: `POST /connect/tiktok/disconnect` — immediately deletes all stored tokens
2. **Support**: Email support@nogeass.com with "Data Deletion Request"
3. **App disconnection**: Revoking access in TikTok Shop Partner Center

## Security Measures

- OAuth tokens encrypted at rest (AES-256-GCM, 256-bit key)
- CSRF protection via HMAC-signed state with httpOnly cookies
- Rate limiting (60 requests/minute per IP)
- Request ID tracking for audit trail
- Secrets never logged or exposed in API responses
- HTTPS/TLS for all API communication

## App URLs

| Resource | URL |
|----------|-----|
| Privacy Policy | `{BASE_URL}/privacy` |
| Terms of Service | `{BASE_URL}/terms` |
| Support | `{BASE_URL}/support` |
| Health Check | `{BASE_URL}/healthz` |

## Technical Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (encrypted token storage)
- **Video Generation**: GPU servers with Three.js, VOICEVOX TTS, FFmpeg
- **CDN**: Cloudflare CDN (`cdn.gawain.nogeass.com`)
