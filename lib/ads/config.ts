import { AdConfig } from './types';

/**
 * Default ad injection configuration
 *
 * - adsShowsInAmountOfNews: 10 (show ads every 10 news items)
 * - amountOfAppearance: 1 (1 ad per window)
 * - enabled: true (ads are enabled by default)
 *
 * Can be overridden via environment variables:
 * - AD_INJECTION_ENABLED
 * - AD_WINDOW_SIZE
 * - AD_PER_WINDOW
 */
export const AD_CONFIG: AdConfig = {
  adsShowsInAmountOfNews: parseInt(process.env.AD_WINDOW_SIZE || '10', 10),
  amountOfAppearance: parseInt(process.env.AD_PER_WINDOW || '1', 10),
  enabled: process.env.AD_INJECTION_ENABLED !== 'false', // Enabled by default
};

/**
 * Validate ad configuration at module load time
 * Ensures amountOfAppearance <= floor(adsShowsInAmountOfNews / 2)
 * This constraint prevents consecutive ad placement
 */
function validateConfig(config: AdConfig): void {
  const maxAdsPerWindow = Math.floor(config.adsShowsInAmountOfNews / 2);

  if (config.amountOfAppearance > maxAdsPerWindow) {
    throw new Error(
      `Invalid ad configuration: amountOfAppearance (${config.amountOfAppearance}) ` +
      `must be ≤ floor(adsShowsInAmountOfNews (${config.adsShowsInAmountOfNews}) / 2) = ${maxAdsPerWindow}. ` +
      `This constraint ensures ads are never consecutive.`
    );
  }

  if (config.adsShowsInAmountOfNews < 2) {
    throw new Error(
      `Invalid ad configuration: adsShowsInAmountOfNews must be at least 2, got ${config.adsShowsInAmountOfNews}`
    );
  }

  if (config.amountOfAppearance < 0) {
    throw new Error(
      `Invalid ad configuration: amountOfAppearance must be non-negative, got ${config.amountOfAppearance}`
    );
  }
}

// Validate configuration at module load
validateConfig(AD_CONFIG);
