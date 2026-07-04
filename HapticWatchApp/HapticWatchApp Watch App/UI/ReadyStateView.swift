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

	var body: some View {
		VStack {
			if logic.activityStarted {
				Spacer()
				Text("STARTED").tint(.green).font(.largeTitle)
			} else {
				Text("Ready").font(.largeTitle)
				Button(action: logic.reset) {
					Text("Stop")
				}
			}
		}
	}
}

#Preview {
	ReadyStateView()
}
