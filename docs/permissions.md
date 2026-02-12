# TikTok Shop API Permissions (Scope Justification)

This document explains which TikTok Shop API permissions Gawain requests and why.

## Requested Scopes

### Product Basic (Read)

- **API**: `/product/202309/products/search`, `/product/202309/products/{productId}`
- **Purpose**: Fetch product titles, descriptions, images, and prices from the seller's TikTok Shop catalog.
- **Why**: Gawain generates promotional videos for products. To create relevant and accurate videos, we need to access the product's title, main images, description, and pricing information.
- **Data handling**: Product data is fetched on-demand and used transiently during video generation. It is not permanently stored.

## Scopes NOT Requested

The following scopes are intentionally **not** requested to minimize data access:

| Scope | Reason for exclusion |
|-------|---------------------|
| Order Management | Not needed — Gawain only generates product videos, not order processing |
| Customer Data | Not needed — No customer interaction required |
| Financial Data | Not needed — Pricing is read from product catalog only |
| Shop Management | Not needed — No shop configuration changes required |
| Inventory Management | Not needed — Stock levels are not used in video generation |
| Promotion/Discount | Not needed — Current pricing is read from product data |
| Logistics | Not needed — No shipping/fulfillment integration |

## Principle of Least Privilege

We follow the principle of least privilege:

1. **Minimum scopes**: Only Product Basic (Read) is requested.
2. **Read-only**: We do not write, update, or delete any data in the seller's TikTok Shop.
3. **No customer data**: We never access order, customer, or financial information.
4. **Token encryption**: OAuth tokens are encrypted at rest with AES-256-GCM.
5. **Token deletion**: Sellers can disconnect at any time, immediately deleting all stored tokens.
