/**
 * TikTok Shop → Gawain conversion (pure functions, no I/O)
 */

import type { GawainJobInput } from '../gawain/types.js';
import type { TikTokShopProduct, ConvertOptions } from './types.js';

const DEFAULT_MAX_IMAGES = 3;
const DEFAULT_MAX_TITLE_LENGTH = 80;
const DEFAULT_MAX_DESCRIPTION_LENGTH = 200;

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate a string to maxLength, appending '...' if truncated.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '\u2026';
}

/**
 * Convert a TikTok Shop product to Gawain job input.
 *
 * Pure function — no side effects, no I/O.
 */
export function toGawainJobInput(
  product: TikTokShopProduct,
  opts?: ConvertOptions
): GawainJobInput {
  const maxImages = Math.max(1, Math.min(opts?.maxImages ?? DEFAULT_MAX_IMAGES, 3));
  const maxTitleLength = opts?.maxTitleLength ?? DEFAULT_MAX_TITLE_LENGTH;
  const maxDescriptionLength = opts?.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH;

  // Title: truncate if too long
  const title = truncate(product.title, maxTitleLength);

  // Description: strip HTML (TikTok sometimes includes HTML), then truncate
  const rawDescription = product.description ? stripHtml(product.description) : undefined;
  const description = rawDescription ? truncate(rawDescription, maxDescriptionLength) : undefined;

  // Images: extract first URL from each main_image's url_list, limit count
  const images = (product.main_images || [])
    .map((img) => img.url_list?.[0])
    .filter((url): url is string => !!url)
    .slice(0, maxImages);

  // Price from first SKU
  const firstSku = product.skus?.[0];
  const price = firstSku?.price
    ? {
        amount: firstSku.price.sale_price || firstSku.price.original_price,
        currency: opts?.currency || firstSku.price.currency || 'JPY',
      }
    : undefined;

  // Variants: map SKUs
  const variants = product.skus?.map((s) => ({
    id: s.id,
    title: s.seller_sku || s.id,
    price: s.price.sale_price || s.price.original_price,
  }));

  return {
    id: String(product.id),
    title,
    description,
    images,
    price,
    variants,
    metadata: {
      source: 'tiktok_shop',
      brand: product.brand?.name,
      categoryId: product.category_list?.[0]?.id,
      categoryName: product.category_list?.[0]?.name,
      ...(opts?.templateText ? { templateText: opts.templateText } : {}),
    },
  };
}

/**
 * Validate that a value has the required shape of a TikTokShopProduct.
 */
export function validateTikTokShopProduct(product: unknown): product is TikTokShopProduct {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const p = product as Record<string, unknown>;

  if (typeof p.id !== 'string' || !p.id.trim()) {
    return false;
  }
  if (typeof p.title !== 'string' || !p.title.trim()) {
    return false;
  }

  return true;
}
