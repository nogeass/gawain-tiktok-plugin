# Partner Center Setup & Submission Steps

## 1. Prerequisites

- TikTok Shop Partner Center account: https://partner.tiktokshop.com
- App created in Partner Center with:
  - App Key and App Secret
  - OAuth Redirect URI configured to `{BASE_URL}/connect/tiktok/callback`
  - Required API scopes enabled (Product Basic — Read)

## 2. Generate Test Access Token

Before submission, test your OAuth flow:

1. Go to Partner Center → Your App → "Test Access Token"
2. Use a test seller account to authorize
3. Verify the token exchange completes successfully
4. Documentation: https://partner.tiktokshop.com/docv2/page/generate-test-access-token

## 3. Configure Environment

Set the following environment variables on your connector server:

```bash
TIKTOK_APP_KEY=your_app_key
TIKTOK_APP_SECRET=your_app_secret
CALLBACK_URL=https://your-domain.com/connect/tiktok/callback
FRONTEND_URL=https://your-domain.com
TOKEN_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
STATE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SQLITE_PATH=/data/connector.db
```

## 4. Deploy the Connector

```bash
# Build and run with Docker
docker build -t gawain-tiktok-connector -f apps/connector/Dockerfile .
docker run -d \
  --name gawain-connector \
  -p 3456:3456 \
  -v connector-data:/data \
  --env-file .env \
  gawain-tiktok-connector
```

## 5. Verify Deployment

```bash
# Health check
curl https://your-domain.com/healthz

# Verify policy pages are accessible
curl -I https://your-domain.com/privacy
curl -I https://your-domain.com/terms
curl -I https://your-domain.com/support
```

## 6. Submit for App Review

In Partner Center → Your App → "Submit for Review":

### Required Information

| Field | Value |
|-------|-------|
| App Name | Gawain Video Generator |
| App Description | AI-powered product video generation for TikTok Shop sellers. Automatically creates promotional videos from your product catalog. |
| Website URL | `https://your-domain.com` |
| Privacy Policy URL | `https://your-domain.com/privacy` |
| Terms of Service URL | `https://your-domain.com/terms` |

### Scope Justification

| Scope | Justification |
|-------|--------------|
| Product Basic (Read) | Required to fetch product titles, images, and prices for generating promotional videos. No other data is accessed. |

### Data Handling Description

```
Gawain accesses only Product Basic data (titles, images, prices) to generate
promotional videos. OAuth tokens are encrypted at rest using AES-256-GCM.
Sellers can disconnect at any time, which immediately and permanently deletes
all stored credentials. Product data is fetched on-demand and not permanently
stored. No customer, order, or financial data is accessed.
```

### Demo Video

Record a demo following `demo_script.md` and attach to the submission.

## 7. Review Process

After submission, expect the following reviews:

1. **App Review**: TikTok reviews app functionality, UI, and compliance
   - Reference: https://partner.tiktokshop.com/docv2/page/publish-and-list-public-app

2. **Data Security & Privacy Review (DSPR)**: Reviews data handling practices
   - Reference: https://partner.tiktokshop.com/docv2/page/data-security-and-privacy-review

3. **Compliance Review**: Ensures compliance with TikTok Shop policies

## 8. Post-Approval

After approval:
- App becomes available as a Public App
- Sellers can find and install it from the App & Service Store
- Monitor usage and maintain the connector server

## Notes

- **TSP requirement**: Listing on the App & Service Store may require TSP (TikTok Shop Partner) certification. If not TSP-certified, the app can still be distributed as a Custom Service via direct link.
- **Review timeline**: Allow 5-10 business days for the full review cycle.
- **Resubmission**: If rejected, address feedback and resubmit. Common issues: insufficient scope justification, missing data deletion flow, incomplete demo.
