import { AdItem, InjectAdsParams, InjectAdsResult, AdConfig } from './types';
import { AdLoader } from './loader';
import { AD_CONFIG } from './config';

/**
 * Inject ads into news feed with random positioning within windows
 *
 * Algorithm:
 * 1. Divide items into windows of size `adsShowsInAmountOfNews`
 * 2. For each window after `startFrom`, inject `amountOfAppearance` ads
 * 3. Randomly position ads within window, ensuring no consecutive placement
 * 4. Rotate through available ads
 *
 * @param params - Injection parameters
 * @returns Array with ads injected and count of ads added
 */
export function injectAds(params: InjectAdsParams): InjectAdsResult {
  const {
    items,
    ads = AdLoader.getAll(),
    startFrom = 0,
    config = {},
  } = params;

  // Merge config with defaults
  const finalConfig: AdConfig = { ...AD_CONFIG, ...config };

  // Early exit conditions
  if (!finalConfig.enabled || ads.length === 0 || items.length === 0) {
    return { items, adsInjected: 0 };
  }

  const {
    adsShowsInAmountOfNews: windowSize,
    amountOfAppearance: adsPerWindow,
  } = finalConfig;

  const result: any[] = [];
  let adsInjected = 0;
  let adRotationIndex = 0;

  // Process items in windows
  let currentIndex = 0;
  while (currentIndex < items.length) {
    const windowStart = currentIndex;
    const windowEnd = Math.min(currentIndex + windowSize, items.length);
    const windowItems = items.slice(windowStart, windowEnd);
    const windowLength = windowItems.length;

    // Should we inject ads in this window?
    const shouldInject = windowEnd > startFrom;

    if (shouldInject && windowLength >= 2) {
      // Calculate how many ads to inject (limited by window size)
      const maxAdsForWindow = Math.min(
        adsPerWindow,
        Math.floor(windowLength / 2) // Never more than half the window
      );

      // Generate random positions ensuring no consecutive placement
      const adPositions = generateRandomPositions(windowLength, maxAdsForWindow);

      // Build window with ads injected
      let adPositionIndex = 0;
      for (let i = 0; i < windowLength; i++) {
        // Check if we should inject ad at this position
        if (adPositionIndex < adPositions.length && adPositions[adPositionIndex] === i) {
          // Inject ad (with rotation and unique ID)
          const baseAd = AdLoader.getByIndex(adRotationIndex);
          const uniqueAd = {
            ...baseAd,
            id: `${baseAd.id}-${adsInjected}`, // Make ID unique for each injection
          };
          result.push(uniqueAd);
          adsInjected++;
          adRotationIndex++;
          adPositionIndex++;
        }

        // Add original news item
        result.push(windowItems[i]);
      }
    } else {
      // No injection - just copy items
      result.push(...windowItems);
    }

    currentIndex = windowEnd;
  }

  return { items: result, adsInjected };
}

/**
 * Generate random positions for ads within a window,
 * ensuring no consecutive placement
 *
 * Uses truly random positioning (no weighting) as confirmed by user.
 * Ensures minimum distance of 1 between any two ads.
 *
 * @param windowSize - Size of the window
 * @param count - Number of positions to generate
 * @returns Sorted array of positions
 */
function generateRandomPositions(windowSize: number, count: number): number[] {
  if (count === 0) return [];

  const positions: number[] = [];
  const availablePositions = Array.from({ length: windowSize }, (_, i) => i);

  // Shuffle available positions for truly random selection
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
  }

  // Select positions from shuffled array, ensuring no consecutive placement
  for (const position of availablePositions) {
    if (positions.length >= count) break;

    // Check if position would create consecutive placement
    const wouldBeConsecutive = positions.some(
      existing => Math.abs(existing - position) === 1
    );

    if (!wouldBeConsecutive) {
      positions.push(position);
    }
  }

  // Sort positions so we can inject in order
  return positions.sort((a, b) => a - b);
}
