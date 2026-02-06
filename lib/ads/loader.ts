import { AdItem } from './types';
import { dabogAd } from './data/dabog';
import { perunioAd } from './data/perunio';

/**
 * AdLoader manages the pool of available ads and provides rotation logic
 */
export class AdLoader {
  private static ads: AdItem[] = [dabogAd, perunioAd];

  /**
   * Get all available ads
   * Returns a copy to prevent external mutation
   */
  static getAll(): AdItem[] {
    return [...this.ads];
  }

  /**
   * Get ad by round-robin index (for rotation)
   * Uses modulo to cycle through available ads
   *
   * @param index - The index to retrieve (will be wrapped with modulo)
   * @returns The ad at the calculated position
   */
  static getByIndex(index: number): AdItem {
    return this.ads[index % this.ads.length];
  }

  /**
   * Get total count of available ads
   */
  static count(): number {
    return this.ads.length;
  }
}
