import { describe, it, expect } from 'vitest';
import { toGawainJobInput, validateTikTokShopProduct } from './convert.js';
import type { TikTokShopProduct } from './types.js';

const sampleProduct: TikTokShopProduct = {
  id: '1729384756012345',
  title: 'Premium Wireless Earbuds',
  description:
    'Experience immersive sound with these premium wireless earbuds. Features include ANC, 30-hour battery life, and IPX5 water resistance.',
  category_list: [{ id: '601226', name: 'Earphones & Headphones' }],
  brand: { id: '7001', name: 'AudioTech' },
  main_images: [
    { url_list: ['https://example.com/images/front.jpg'], width: 800, height: 800 },
    { url_list: ['https://example.com/images/case.jpg'], width: 800, height: 800 },
    { url_list: ['https://example.com/images/lifestyle.jpg'], width: 800, height: 800 },
  ],
  skus: [
    {
      id: '1729384756012345-001',
      seller_sku: 'EARBUDS-BLK',
      price: { original_price: '12800', sale_price: '9800', currency: 'JPY' },
      stock_infos: [{ available_stock: 100 }],
    },
    {
      id: '1729384756012345-002',
      seller_sku: 'EARBUDS-WHT',
      price: { original_price: '12800', sale_price: '9800', currency: 'JPY' },
      stock_infos: [{ available_stock: 50 }],
    },
  ],
  status: 4,
};

describe('toGawainJobInput', () => {
  it('converts a full TikTok Shop product', () => {
    const result = toGawainJobInput(sampleProduct);

    expect(result.id).toBe('1729384756012345');
    expect(result.title).toBe('Premium Wireless Earbuds');
    expect(result.images).toEqual([
      'https://example.com/images/front.jpg',
      'https://example.com/images/case.jpg',
      'https://example.com/images/lifestyle.jpg',
    ]);
    expect(result.price).toEqual({ amount: '9800', currency: 'JPY' });
    expect(result.variants).toHaveLength(2);
    expect(result.variants?.[0]).toEqual({
      id: '1729384756012345-001',
      title: 'EARBUDS-BLK',
      price: '9800',
    });
    expect(result.metadata).toEqual({
      source: 'tiktok_shop',
      brand: 'AudioTech',
      categoryId: '601226',
      categoryName: 'Earphones & Headphones',
    });
  });

  it('uses original_price when sale_price is missing', () => {
    const product: TikTokShopProduct = {
      ...sampleProduct,
      skus: [
        {
          id: 'sku-1',
          price: { original_price: '15000', currency: 'USD' },
        },
      ],
    };
    const result = toGawainJobInput(product);
    expect(result.price).toEqual({ amount: '15000', currency: 'USD' });
  });

  it('handles product with no images', () => {
    const product: TikTokShopProduct = {
      id: '123',
      title: 'No images product',
    };
    const result = toGawainJobInput(product);
    expect(result.images).toEqual([]);
  });

  it('handles product with no skus', () => {
    const product: TikTokShopProduct = {
      id: '123',
      title: 'No SKU product',
    };
    const result = toGawainJobInput(product);
    expect(result.price).toBeUndefined();
    expect(result.variants).toBeUndefined();
  });

  it('truncates long title', () => {
    const product: TikTokShopProduct = {
      id: '123',
      title: 'A'.repeat(100),
    };
    const result = toGawainJobInput(product, { maxTitleLength: 20 });
    expect(result.title.length).toBe(20);
    expect(result.title.endsWith('\u2026')).toBe(true);
  });

  it('truncates long description and strips HTML', () => {
    const product: TikTokShopProduct = {
      id: '123',
      title: 'Test',
      description: '<p>' + 'X'.repeat(300) + '</p>',
    };
    const result = toGawainJobInput(product, { maxDescriptionLength: 50 });
    expect(result.description!.length).toBe(50);
    expect(result.description).not.toContain('<');
  });

  it('limits images to maxImages', () => {
    const result = toGawainJobInput(sampleProduct, { maxImages: 1 });
    expect(result.images).toHaveLength(1);
  });

  it('overrides currency', () => {
    const result = toGawainJobInput(sampleProduct, { currency: 'USD' });
    expect(result.price?.currency).toBe('USD');
  });

  it('includes templateText in metadata', () => {
    const result = toGawainJobInput(sampleProduct, { templateText: 'Custom text' });
    expect(result.metadata?.templateText).toBe('Custom text');
  });

  it('handles empty url_list in images', () => {
    const product: TikTokShopProduct = {
      id: '123',
      title: 'Test',
      main_images: [
        { url_list: [] },
        { url_list: ['https://example.com/valid.jpg'] },
      ],
    };
    const result = toGawainJobInput(product);
    expect(result.images).toEqual(['https://example.com/valid.jpg']);
  });
});

describe('validateTikTokShopProduct', () => {
  it('validates a valid product', () => {
    expect(validateTikTokShopProduct(sampleProduct)).toBe(true);
  });

  it('validates minimal product', () => {
    expect(validateTikTokShopProduct({ id: '123', title: 'Test' })).toBe(true);
  });

  it('rejects null', () => {
    expect(validateTikTokShopProduct(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateTikTokShopProduct('string')).toBe(false);
  });

  it('rejects missing id', () => {
    expect(validateTikTokShopProduct({ title: 'Test' })).toBe(false);
  });

  it('rejects missing title', () => {
    expect(validateTikTokShopProduct({ id: '123' })).toBe(false);
  });

  it('rejects empty id', () => {
    expect(validateTikTokShopProduct({ id: '  ', title: 'Test' })).toBe(false);
  });

  it('rejects empty title', () => {
    expect(validateTikTokShopProduct({ id: '123', title: '  ' })).toBe(false);
  });

  it('rejects numeric id', () => {
    expect(validateTikTokShopProduct({ id: 123, title: 'Test' })).toBe(false);
  });
});
