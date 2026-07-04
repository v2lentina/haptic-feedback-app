//
//  Actions.swift
//  HapticWatchApp
//
//  Created by Felix on 15.05.26.
//

import WatchKit

class Actions: NSObject, WKExtendedRuntimeSessionDelegate {
	func extendedRuntimeSession(
		_ extendedRuntimeSession: WKExtendedRuntimeSession,
		didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason, error: (any Error)?
	) {}

	func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {}

	func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {}

	var session: WKExtendedRuntimeSession?
	func activateSession() {
		print("Started session")
		session = WKExtendedRuntimeSession()
		session?.delegate = self
		session?.start()
	}

	func stopSession() {
		print("Stopped session")
		try session?.invalidate()
		session = nil
	}

	/// Maps the pattern `[duration, delay, duration, delay...]`
	func playVibrationPattern(vibrationMessage: VibrationMessage) {
		Task {
			var typ: WKHapticType?
			var strength: Int?
			for (index, value) in vibrationMessage.pattern.enumerated() {
				// Play a haptic every other value (the 'pulses')
				if index % 2 == 0 {
					strength = Int(value)
					typ = _strengthToWKHapticType(strength: value)
					continue;
				}

				let playTime = Int(value.rounded())
				print("playTime: \(playTime) strength: \(strength ?? -1)")

				if typ != nil {
//					let dur = _WKHapticTypeToDuration(type: typ!)

//					print("playtime: \(playTime) vibDur: \(dur)")

					//				  var currentMs: Int = 0
					//                while currentMs+dur <= playTime  {
					WKInterfaceDevice.current().play(typ!)
					//                    try? await Task.sleep(for: Duration.milliseconds(dur), tolerance: .zero)
					//                    currentMs += dur
					//                }
				}

				try? await Task.sleep(
					for: Duration.milliseconds(Double(playTime)), tolerance: .zero)
			}
		}
	}

	/// Returns a suitable [WKHapticType] based on the strength
	private func _strengthToWKHapticType(strength: Float) -> WKHapticType? {
		if strength >= 90 {
			return .failure
		} else if strength >= 85 {
			return .retry
		} else if strength >= 60 {
			return .directionDown
		} else if strength >= 30 {
			return .start
		} else if strength > 0 {
			return .click
		} else {
			return nil  // don't vibrate
		}
	}
}
