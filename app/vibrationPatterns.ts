
export type VibrationPattern = [number];

interface VibrationPatternsType {
	[key: any]: VibrationPattern,
}

/**
 * Values are like [Garmin's API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html)
 *
 * Basically [strength, duration].
 * Where strength is in the inclusive range [0, 100]
 * and duration in milliseconds
 */
const VibrationPatterns = {
	BUZZ_SHORT: [75, 50],
	BUZZ_TACTILE: [100, 50],
	BUZZ_NORMAL: [75, 100],
	BUZZ_LONG: [75, 300],
	BUZZ_IMPORTANT: [100, 300, 0, 300, 100, 300, 0, 300, 100, 300, 0, 300, 100, 500],
} as VibrationPatternsType;

export default VibrationPatterns;