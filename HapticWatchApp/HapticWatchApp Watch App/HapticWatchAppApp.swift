//
//  HapticWatchAppApp.swift
//  HapticWatchApp Watch App
//
//  Created by Felix on 24.04.26.
//

import SwiftUI

@main
struct HapticWatchApp_Watch_AppApp: App {
    @StateObject var logic = Logic()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                // This makes the object available to all child views
                //   via "@EnvironmentObject var bleManager: BLECentralManager"
                .environmentObject(logic)
        }
    }
}
