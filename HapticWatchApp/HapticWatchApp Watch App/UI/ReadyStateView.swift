//
//  ReadyStateView.swift
//  HapticWatchApp Watch App
//
//  Created by Felix on 15.05.26.
//

import Combine
import SwiftUI

struct ReadyStateView: View {
	@EnvironmentObject var logic: Logic

	//    /// Sorted by strength from soft to strong
	//    private let WKHapticTypes: [WKHapticType] = [
	//        // almost imperceptible on the wrist alone, with another hand on it, clearly perceptible
	//        // clicky, can be played in fast succession
	//        .click,
	//        .directionDown,
	////        .directionUp, // same vibration
	//        .notification, // long
	//        .start, // clicky, can be played in fast succession
	//        .retry, // a thad lower frequency than failure
	//        .failure,
	////        .stop, // same as .start, but twice in a row
	//        .success, // 3 fast vibrations in succession
	//    ]
	// clicky enough: click, start

	var body: some View {
		ScrollView {
			VStack {
				if logic.activityStarted {
					Spacer()
					Text("STARTED").tint(.green).font(.largeTitle)
				} else {
					Text("Ready").font(.largeTitle)
					Button(action: logic.reset) {
						Text("Stop")
					}
					//                ForEach(WKHapticTypes, id: \.self) { type in
					//                    Button(action: { WKInterfaceDevice.current().play(type)} ) {
					//                        Text("\(type)")
					//                    }
					//                }
				}
			}
		}
	}
}

#Preview {
	ReadyStateView()
}
