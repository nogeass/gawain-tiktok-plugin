# E2E Demo Script — TikTok Shop Connector

This script demonstrates the full user journey for the TikTok Shop App Review.

## Prerequisites

- Connector server running at `{BASE_URL}`
- TikTok Shop test seller account with at least 1 product
- Test access token generated via Partner Center

## Demo Steps

### Step 1: Health Check

```
GET {BASE_URL}/healthz
→ { "status": "ok", "timestamp": "..." }
```

Confirms the service is running and healthy.

### Step 2: View Policy Pages

Open in browser:
- `{BASE_URL}/privacy` — Privacy Policy page
- `{BASE_URL}/terms` — Terms of Service page
- `{BASE_URL}/support` — Support & data deletion information

### Step 3: Initiate OAuth Connection

Open in browser:
```
{BASE_URL}/connect/tiktok/start?install_id=demo-seller-001
```

**Expected behavior**:
1. Browser redirects to TikTok Shop authorization page
2. Seller reviews requested permissions (Product Basic — Read)
3. Seller clicks "Authorize"

### Step 4: OAuth Callback (Automatic)

After authorization, TikTok redirects back to:
```
{BASE_URL}/connect/tiktok/callback?code=XXX&state=YYY
```

**Expected behavior**:
1. Server verifies CSRF state (cookie + URL nonce match)
2. Server exchanges authorization code for tokens
3. Tokens are encrypted and stored in database
4. Browser redirects to frontend with `?connected=true`

### Step 5: Verify Connection Status

```
GET {BASE_URL}/connect/tiktok/status?install_id=demo-seller-001
→ { "connected": true }
```

Confirms the seller's TikTok Shop account is now connected.

### Step 6: Disconnect (Data Deletion)

```
POST {BASE_URL}/connect/tiktok/disconnect
Content-Type: application/json

{ "installId": "demo-seller-001" }
→ { "ok": true, "deleted": true }
```

### Step 7: Verify Disconnection

```
GET {BASE_URL}/connect/tiktok/status?install_id=demo-seller-001
→ { "connected": false }
```

Confirms all tokens have been permanently deleted.

## Demo Video Guidelines

When recording a demo video for submission:

1. **Show health check** (5 seconds)
2. **Show policy pages** — scroll through privacy, terms, support (30 seconds)
3. **Initiate OAuth** — click start link, show TikTok auth page (15 seconds)
4. **Complete authorization** — click authorize, show redirect back (10 seconds)
5. **Verify connection** — call status endpoint (5 seconds)
6. **Disconnect** — call disconnect endpoint (5 seconds)
7. **Verify deletion** — call status endpoint again, show connected=false (5 seconds)

**Total estimated time**: ~75 seconds
