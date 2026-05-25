//
//  Actions.swift
//  HapticWatchApp
//
//  Created by Felix on 15.05.26.
//
import WatchKit

class Actions {
    /// Maps the pattern `[duration, delay, duration, delay...]`
    func playVibrationPattern(vibrationMessage: VibrationMessage) {
        Task {
            var typ: WKHapticType = .click;
            for (index, value) in vibrationMessage.pattern.enumerated() {
                // Play a haptic every other value (the 'pulses')
                if index % 2 == 0 {
                    typ = _strengthToWKHapticType(strength: value)
                    
                    print("strength: \(value)")
                }
                
                let dur = _WKHapticTypeToDuration(type: typ)
                let playTime = Int(value.rounded())
                
                print("playtime: \(playTime) vibDur: \(dur)")
                
                var currentMs:Int = 0
//                while currentMs+dur <= playTime  {
                    WKInterfaceDevice.current().play(typ)
//                    try? await Task.sleep(for: Duration.milliseconds(dur), tolerance: .zero)
//                    currentMs += dur
//                }
                
                try? await Task.sleep(for: Duration.milliseconds(Double(playTime - currentMs)), tolerance: .zero)
            }
        }
    }
    
    private func _WKHapticTypeToDuration(type: WKHapticType) -> Int {
        return switch type {
            case .notification:
                100
            case .directionUp, .directionDown:
                150
            case .success:
                100
            case .failure:
                50
            case .retry:
                200
            case .start:
                100
            case .stop:
                300
            case .click:
                100
            default:
                100
        }
    }

    /// Returns a suitable [WKHapticType] based on the strength
    private func _strengthToWKHapticType(strength: Float) -> WKHapticType {
        if (strength >= 90) {
            return .failure
        } else if (strength >= 85) {
            return .retry
        } else if ( strength >= 50) {
            return .directionDown
        } else if (strength >= 30) {
            return .start
        } else {
            return .click
        }
    }
}
