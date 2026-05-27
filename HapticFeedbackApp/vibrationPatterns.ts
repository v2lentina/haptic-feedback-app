
export type VibrationPattern = number[];

// interface VibrationPatternsType {
// 	[key: string]: VibrationPattern,
// }

/**
 * Values are like [Garmin's API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html)
 *
 * Basically [strength, duration].
 * Where strength is in the inclusive range [0, 100]
 * and duration in milliseconds
 */
const VibrationPatterns = {
	BUZZ_SHORT: [75, 50] as VibrationPattern,
	BUZZ_TACTILE: [100, 50] as VibrationPattern,
	BUZZ_NORMAL: [75, 100] as VibrationPattern,
	BUZZ_LONG: [75, 300] as VibrationPattern,
	BUZZ_IMPORTANT: [100, 300, 0, 300, 100, 300, 0, 300, 100, 300, 0, 300, 100, 500] as VibrationPattern,
};

export default VibrationPatterns;