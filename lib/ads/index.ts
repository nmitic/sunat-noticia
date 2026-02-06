/**
 * Public API for the ad injection system
 *
 * Usage:
 * import { injectAds } from '@/lib/ads';
 *
 * const { items: newsWithAds, adsInjected } = injectAds({ items: news });
 */

export { injectAds } from './injector';
export { AdLoader } from './loader';
export { AD_CONFIG } from './config';
export type { AdItem, AdConfig, InjectAdsParams, InjectAdsResult } from './types';
export { isAd } from './types';
