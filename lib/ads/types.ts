import { NewsCategory, NewsFlag } from '@/lib/db/schema';

/**
 * AdItem represents a sponsored advertisement that mimics the structure
 * of a regular news item. It must be compatible with NewsCard component props.
 */
export interface AdItem {
  id: string;                    // Unique ad identifier (e.g., "ad-dabog-1")
  title: string;                 // Ad headline
  content: string;               // Ad description/body
  source: string;                // Sponsor name
  sourceUrl: string;             // Link to sponsor site
  category: NewsCategory;        // Will use 'NOTICIAS' category
  flags: NewsFlag[];             // Empty array (no flags for ads)
  originalDate: Date;            // Creation date (for sorting)
  publishedAt: Date;             // Same as originalDate
  adds: true;                    // Spanish flag: marks this as an ad
}

/**
 * Configuration for ad injection behavior
 */
export interface AdConfig {
  adsShowsInAmountOfNews: number;  // Window size (how many news items per window)
  amountOfAppearance: number;      // How many ads to show per window
  enabled: boolean;                // Global toggle for ad injection
}

/**
 * Parameters for the injectAds function
 */
export interface InjectAdsParams {
  items: any[];                    // News items array (NewsItem[])
  ads?: AdItem[];                  // Optional: override default ads
  startFrom?: number;              // Skip injection before this index
  config?: Partial<AdConfig>;      // Optional: override config
}

/**
 * Result returned by injectAds function
 */
export interface InjectAdsResult {
  items: any[];                    // Mixed array of news items and ads
  adsInjected: number;             // Count of ads that were injected
}

/**
 * Type guard to check if an item is an ad
 */
export function isAd(item: any): item is AdItem {
  return item && typeof item === 'object' && 'adds' in item && item.adds === true;
}
