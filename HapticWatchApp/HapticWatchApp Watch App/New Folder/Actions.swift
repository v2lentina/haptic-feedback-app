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
            for (index, value) in vibrationMessage.pattern.enumerated() {
                // Play a haptic every other value (the 'pulses')
                if index % 2 == 0 {
                    // Choose a type based on your 'intensity' logic
                    // .click is short, .success is a double-tap, etc.
                    WKInterfaceDevice.current().play(_strengthToWKHapticType(strength: value))
                }
                
                try? await Task.sleep(for: Duration.seconds(Double(value)), tolerance: .zero)
            }
        }
    }
    

    /// Returns a suitable [WKHapticType] based on the strength
    private func _strengthToWKHapticType(strength: Float) -> WKHapticType {
        if (strength > 90) {
            return .underwaterDepthCriticalPrompt
        } else if (strength > 75) {
            return .underwaterDepthPrompt
        } else if ( strength > 50) {
            return .success
        } else if (strength > 30) {
            return .start
        } else {
            return .click
        }
    }
}
