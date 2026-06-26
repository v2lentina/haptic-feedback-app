//
//  Logic.swift
//  HapticWatchApp
//
//  Created by Felix on 16.05.26.
//

import Foundation
import Combine

/// Combines [BleHander], [ProtocolHandler] and [Actions] to form the Logic layer
class Logic : ObservableObject {
    final let ble = BLECentralManager()
    final let _protocol = ProtocolHandler()
    final let _actions = Actions()
    
    private var _bleSubscription: AnyCancellable?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        ble.onConnected = { [self] in
            ble.sendData(stringMessage: _protocol.getHandshakeMessage())
            print("HANDSHAKE written to phone. Awaiting notify response...")
            
            let response = await ble.waitForData().value
            
            print("Got connection: \(response)")
            
            _onReady()
        }
        
        _protocol.onVibrationMessage = { [self] msg in
            print("Got vibration message")
            _actions.playVibrationPattern(vibrationMessage: msg)
        }
        
        // Forward the child's objectWillChange event to the parent
        ble.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
    
    /// Called when a connection has been established
    func _onReady() {
        ble.isConnected = true;
		_actions.activateSession()
        _bleSubscription = ble.responseStream
            .receive(on: DispatchQueue.main)
            .sink { [self] msg in
            do {
                try _protocol.handleMessage(bleMessageText: msg)
            } catch {
                print("Error while handling '\(msg)'")
            }
        }
    }
    
    /// Resets the state and connection to initial state, making sure everything is cleaned up for re-use
    func reset() {
		_actions.stopSession()
        ble.reset()
    }
}
