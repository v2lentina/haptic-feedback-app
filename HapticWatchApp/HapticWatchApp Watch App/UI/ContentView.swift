//
//  ContentView.swift
//  HapticWatchApp Watch App
//
//  Created by Felix on 24.04.26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var logic: Logic
    
    var body: some View {
        VStack {
            switch logic.ble.isConnected {
                // This text updates automatically when statusMessage changes
                case false: Text(logic.ble.statusMessage)
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .padding()
                case true: ReadyStateView()
            }
        }
        .onAppear() {
            logic.ble.startScan()
        }
        .padding()
    }
}

#Preview {
    // 1. Create a dummy instance for the preview to use
    let mockManager = BLECentralManager()
    
    // 2. Manually set a state so you can see how it looks in the canvas
    mockManager.statusMessage = "Found: Your iPhone"
    
    // 3. Return the view with the environment object attached
    return ContentView()
        .environmentObject(mockManager)
}
