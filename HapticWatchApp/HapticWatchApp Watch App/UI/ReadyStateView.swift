//
//  ReadyStateView.swift
//  HapticWatchApp Watch App
//
//  Created by Felix on 15.05.26.
//

import SwiftUI
import Combine

struct ReadyStateView: View {
    @EnvironmentObject var logic: Logic
    
    var body: some View {
                Text("Ready").font(.largeTitle);
                Button(action: logic.reset) {
                    Text("Stop")
                }
    }
}

#Preview {
    ReadyStateView()
}
