# Privacy Policy

**Gawain TikTok Shop Connector**
Last updated: 2025-02-12

## 1. Data We Collect

When you connect your TikTok Shop account to Gawain, we collect and process:

- **OAuth Tokens**: Access token and refresh token provided by TikTok Shop during authorization. These are stored encrypted (AES-256-GCM) on our servers and used solely to access the TikTok Shop API on your behalf.
- **Shop Information**: Open ID and seller name returned by TikTok during the OAuth flow.
- **Product Data**: Product titles, descriptions, images, and prices fetched from your TikTok Shop catalog for the purpose of generating product videos.

## 2. How We Use Your Data

- **Video Generation**: We use your product data (title, images, price) to automatically generate promotional videos for your TikTok Shop products.
- **API Access**: OAuth tokens are used exclusively to call TikTok Shop APIs on your behalf. We do not use your tokens for any other purpose.

## 3. Data Storage and Security

- OAuth tokens are encrypted at rest using **AES-256-GCM** with a server-side encryption key.
- Tokens are stored in a SQLite database with encrypted data blobs — individual token values are never stored in plaintext.
- All API communication uses HTTPS/TLS.
- Server access is restricted to authorized personnel only.

## 4. Data Retention

- **OAuth Tokens**: Retained only while your TikTok Shop account is connected. Tokens are permanently deleted when you disconnect.
- **Product Data**: Fetched on-demand and not permanently stored. Product data is used transiently during video generation.
- **Generated Videos**: Stored on our CDN until you delete them.
- **Server Logs**: Retained for up to 30 days for debugging purposes. Logs never contain tokens or secrets.

## 5. Data Sharing

We do **not** share, sell, or transfer your data to any third parties, except:

- **TikTok Shop API**: We send API requests to TikTok on your behalf using your authorized tokens.
- **Infrastructure Providers**: Our servers run on standard cloud infrastructure (AWS). Data is encrypted in transit and at rest.

## 6. Your Rights

You have the right to:

- **Disconnect**: Revoke access at any time via the disconnect endpoint or our support page. This permanently deletes all stored tokens.
- **Data Deletion**: Request complete deletion of all your data by contacting our support team.
- **Access**: Request information about what data we store about your account.

## 7. Data Deletion

To delete your data:

1. Use the "Disconnect" feature in the app to remove your TikTok Shop connection and delete stored tokens.
2. For complete data deletion, contact us at **support@nogeass.com** with subject "Data Deletion Request".

## 8. Changes to This Policy

We may update this policy from time to time. Changes will be posted on this page with an updated revision date.

## 9. Contact

For privacy-related inquiries:
- Email: **support@nogeass.com**
- Website: [https://gawain.nogeass.com](https://gawain.nogeass.com)
