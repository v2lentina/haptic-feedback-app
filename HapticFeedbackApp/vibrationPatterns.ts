
export type VibrationPattern = number[];

// interface VibrationPatternsType {
// 	[key: string]: VibrationPattern,
// }

const d = (ms: number): [number, number] => [0, ms];

const BUZZ_TACTILE: VibrationPattern = [100, 50];
const BUZZ_SHORT: VibrationPattern = [25, 50];
const BUZZ_LONG: VibrationPattern = [75, 300];
const BUZZ_NORMAL: VibrationPattern = [50, 100];

const BUZZ_SHORT_WEAK: VibrationPattern = [35, 150]
const BUZZ_ACTIVITY_START: VibrationPattern = [...BUZZ_SHORT_WEAK, ...d(400), ...BUZZ_SHORT_WEAK, ...d(400), ...BUZZ_SHORT_WEAK];
const BUZZ_ACTIVITY_STOP: VibrationPattern = [...BUZZ_LONG, ...d(250), ...BUZZ_LONG, ...d(250), ...BUZZ_LONG, ...d(250), 90, 800];

/**
 * Values are like [Garmin's API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html)
 *
 * Basically [strength, duration].
 * Where strength is in the inclusive range [0, 100]
 * and duration in milliseconds
 */
const VibrationPatterns = {
	BUZZ_SHORT,
	BUZZ_TACTILE,
	BUZZ_NORMAL,
	BUZZ_LONG,
	BUZZ_IMPORTANT: [100, 250, 0, 300, 100, 300, 0, 300, 100, 300, 0, 300, 100, 500] as VibrationPattern,
	//
	BUZZ_ACTIVITY_START,
	BUZZ_ACTIVITY_STOP
};

export default VibrationPatterns;