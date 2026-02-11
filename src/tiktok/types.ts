/**
 * TikTok Shop platform types
 */

/**
 * TikTok Shop product structure
 * See: https://partner.tiktokshop.com/docv2/page/products-api-overview
 */
export interface TikTokShopProduct {
  id: string;
  title: string;
  description?: string;
  category_list?: Array<{
    id: string;
    name: string;
  }>;
  brand?: {
    id: string;
    name: string;
  };
  main_images?: Array<{
    url_list: string[];
    width?: number;
    height?: number;
  }>;
  skus?: Array<{
    id: string;
    seller_sku?: string;
    price: {
      original_price: string;
      sale_price?: string;
      currency: string;
    };
    stock_infos?: Array<{
      available_stock: number;
    }>;
  }>;
  /** 1=draft, 2=pending, 3=failed, 4=live, 5=seller_deactivated, 6=platform_deactivated, 7=freeze */
  status?: number;
  create_time?: number;
  update_time?: number;
}

/**
 * Options for TikTok Shop-to-Gawain conversion
 */
export interface ConvertOptions {
  /** Override promotional template text */
  templateText?: string;
  /** Currency code override (default: from SKU) */
  currency?: string;
  /** Maximum number of images to include (1-3, default 3) */
  maxImages?: number;
  /** Maximum title length before truncation (default 80) */
  maxTitleLength?: number;
  /** Maximum description length before truncation (default 200) */
  maxDescriptionLength?: number;
}
