//
//  ContentView.swift
//  HapticWatchApp Watch App
//
//  Created by Felix on 24.04.26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var logic: Logic
	
	/// Sorted by strength from soft to strong
	private let WKHapticTypes: [WKHapticType] = [
		// almost imperceptible on the wrist alone, with another hand on it, clearly perceptible
		// clicky, can be played in fast succession
		.click,
		.directionDown,
		//        .directionUp, // same vibration
		.notification, // long
		.start, // clicky, can be played in fast succession
		.retry, // a thad lower frequency than failure
		.failure,
		//        .stop, // same as .start, but twice in a row
		.success, // 3 fast vibrations in succession
	]
	//	 clicky enough: click, start
    
    var body: some View {
		ScrollView {
			VStack {
				switch logic.ble.isConnected {
					// This text updates automatically when statusMessage changes
				case false: Text(logic.ble.statusMessage)
						.font(.headline)
						.multilineTextAlignment(.center)
						.padding()
				case true: ReadyStateView()
				}
				ForEach(WKHapticTypes, id: \.self) { type in
					Button(action: { WKInterfaceDevice.current().play(type)} ) {
						Text("\(type)")
					}
				}
			}
		}
        .onAppear() {
            logic.ble.startScan()
        }
    }
}

#Preview {
    // 1. Create a dummy instance for the preview to use
    let mockManager = BLECentralManager()
    
    // 2. Manually set a state so you can see how it looks in the canvas
    mockManager.statusMessage = "Found: HFA"
    
    // 3. Return the view with the environment object attached
    return ContentView()
        .environmentObject(mockManager)
}
