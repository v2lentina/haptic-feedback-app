//
//  ProtocolHandler.swift
//  HapticWatchApp
//
//  Created by Felix on 15.05.26.
//

import Foundation
import SwiftyJSON
import WatchKit

class ProtocolHandler : ObservableObject {
    var onHandshakeMessage: (() -> Void)?
    var onVibrationMessage: ((VibrationMessage) -> Void)?
	var onStartMessage: ((BleMessage) -> Void)?
	var onStopMessage: ((BleMessage) -> Void)?
    
    func handleMessage(bleMessageText: String) throws {
        let json = JSON(parseJSON: bleMessageText)
        
        let type = json["type"].stringValue;
        let body = json["body"];

        switch type {
		case "START":
			try _handleStartMessage(BleMessage(type: "START", body: body.string ?? ""))
		case "STOP":
			try _handleStopMessage(BleMessage(type: "STOP", body: body.string ?? ""))
        case "VIBRATION":
            try _handleVibrationMessage(vibrationMessage: VibrationMessage(body: body.arrayValue.map {$0.floatValue}))
        case "HANDSHAKE":
            try _handleHandshakeMessage(bleMessage: BleMessage(type: type, body: body.stringValue))
        default:
            throw ParsingError.unknownType(type: type)
        }
    }
	
	/// Handle that an activity has started
	func _handleStartMessage(_ bleMessage: BleMessage) throws {
		onStartMessage?(bleMessage)
	}
	
	func _handleStopMessage(_ bleMessage: BleMessage) throws {
		onStopMessage?(bleMessage)
	}
    
    func _handleVibrationMessage(vibrationMessage: VibrationMessage) throws {
        print(vibrationMessage)
        onVibrationMessage?(vibrationMessage)
    }
    
    /// Defines the message sent to the connected Phone, such that it acknowledges the connection as established.
    func getHandshakeMessage() -> String {
        return "{\"type\":\"HANDSHAKE\",\"body\":\"Apple Watch\"}"
    }
    
    func _handleHandshakeMessage(bleMessage: BleMessage) throws {
        onHandshakeMessage?()
    }
}

class VibrationMessage: BleMessage {
    init(body: [Float]) {
        self.pattern = body
        super.init(type: "VIBRATION", body: body.description)
    }
    
    let pattern: [Float];
}

enum ParsingError: Error {
    case unknownType(type: String);
}
