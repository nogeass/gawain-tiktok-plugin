# gawain-tiktok-plugin

TikTok Shop plugin for [Gawain](https://gawain.nogeass.com) AI video generation API.

SDK / reference implementation for converting TikTok Shop products into Gawain video generation jobs.

## Quick Start

```bash
# Clone
git clone https://github.com/nogeass/gawain-tiktok-plugin.git
cd gawain-tiktok-plugin

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Run tests
npm test

# Demo (requires .env configured)
npm run demo -- --product ./samples/product.sample.json

# HTTP server
npm run serve
```

## Features

- **Product Conversion**: Pure-function conversion from TikTok Shop product format to Gawain job input
- **TikTok Shop OAuth**: OAuth 2.0 authorization, token exchange, and refresh helpers
- **Product Fetching**: Fetch products from TikTok Shop Open API
- **Gawain API Client**: Job creation, status polling, and completion waiting
- **Embeddable Widget**: Standalone video carousel widget for any web page
- **CLI Demo**: Test the full pipeline from command line

## API

### Conversion

```typescript
import { toGawainJobInput, validateTikTokShopProduct } from 'gawain-tiktok-plugin';

const product = { id: '123', title: 'My Product', ... };

if (validateTikTokShopProduct(product)) {
  const jobInput = toGawainJobInput(product, { currency: 'JPY' });
}
```

### Gawain Client

```typescript
import { GawainClient } from 'gawain-tiktok-plugin';

const client = new GawainClient({
  apiBase: 'https://gawain.nogeass.com',
  apiKey: 'gawain_live_...',  // optional
});

const { jobId } = await client.createJob(installId, jobInput);
const result = await client.waitJob(jobId, {
  onProgress: (job) => console.log(`${job.progress}%`),
});
console.log(result.previewUrl);
```

### TikTok OAuth

```typescript
import { buildAuthUrl, exchangeCodeForToken, refreshAccessToken } from 'gawain-tiktok-plugin';

// Build authorization URL
const authUrl = buildAuthUrl({ appKey: '...', appSecret: '...' }, state);

// Exchange code for token
const tokens = await exchangeCodeForToken(config, authCode);

// Refresh expired token
const newTokens = await refreshAccessToken(config, tokens.refresh_token);
```

### Fetch Products

```typescript
import { fetchTikTokProduct, fetchTikTokProducts } from 'gawain-tiktok-plugin';

const product = await fetchTikTokProduct({
  appKey: '...',
  accessToken: '...',
  shopCipher: '...',
  productId: '123',
});

const { products, nextPageToken } = await fetchTikTokProducts({
  appKey: '...',
  accessToken: '...',
  shopCipher: '...',
  pageSize: 20,
});
```

## Embeddable Widget

Add the video carousel to any web page:

```html
<div class="gawain-video-section"
  data-api-base="https://gawain.nogeass.com"
  data-shop-id="YOUR_TIKTOK_SHOP_ID"
  data-product-id="OPTIONAL_PRODUCT_ID"
  data-heading="Product Videos"
  data-video-width="180">
</div>
<link rel="stylesheet" href="https://cdn.gawain.nogeass.com/widget/gawain-video-widget.css">
<script src="https://cdn.gawain.nogeass.com/widget/gawain-video-widget.js" defer></script>
```

See `widget/demo.html` for a working example.

## HTTP Server

Start the HTTP wrapper:

```bash
npm run serve
# Server on port 3456

# Convert product
curl -X POST http://localhost:3456/convert \
  -H 'Content-Type: application/json' \
  -d '{"product": {"id":"123","title":"Test"}}'

# Create preview
curl -X POST http://localhost:3456/demo/create-preview \
  -H 'Content-Type: application/json' \
  -d '{"installId":"uuid","product":{"id":"123","title":"Test","main_images":[{"url_list":["https://example.com/img.jpg"]}]}}'
```

## Development

```bash
npm run build        # Compile TypeScript
npm test             # Run tests
npm run typecheck    # Type check without emit
npm run lint         # Lint
npm run format       # Format code
```

## License

MIT
