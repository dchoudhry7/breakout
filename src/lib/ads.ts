/**
 * Rewarded-ad hook. Watching an ad lets the user skip the wait on an unblock gate.
 *
 * PLACEHOLDER: no ad network is wired up yet. To go live, call `setAdHandler` once at startup
 * with a function that shows a rewarded ad (e.g. via react-native-google-mobile-ads) and resolves
 * `true` only if the user watched it to the end. Nothing else in the app needs to change.
 */
export type AdHandler = () => Promise<boolean>;

const PLACEHOLDER_MS = 4000;

let handler: AdHandler = () => new Promise((resolve) => setTimeout(() => resolve(true), PLACEHOLDER_MS));

export function setAdHandler(next: AdHandler) {
  handler = next;
}

/** Shows a rewarded ad. Resolves true if the user earned the reward. */
export function showRewardedAd(): Promise<boolean> {
  return handler().catch(() => false);
}
