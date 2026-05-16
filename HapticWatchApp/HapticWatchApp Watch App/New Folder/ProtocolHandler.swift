//
//  ProtocolHandler.swift
//  HapticWatchApp
//
//  Created by Felix on 15.05.26.
//

import Foundation
import SwiftyJSON

class ProtocolHandler : ObservableObject {
    var onHandshakeMessage: (() -> Void)?
    var onVibrationMessage: ((VibrationMessage) -> Void)?
    
    func handleMessage(bleMessageText: String) throws {
        let json = JSON(parseJSON: bleMessageText)
        
        let type = json["type"].stringValue;
        let body = json["body"];

        switch type {
        case "VIBRATION":
            try _handleVibrationMessage(vibrationMessage: VibrationMessage(body: body.arrayValue.map {$0.floatValue}))
        case "HANDSHAKE":
            try _handleHandshakeMessage(bleMessage: BleMessage(type: type, body: body.stringValue))
        default:
            throw ParsingError.unknownType(type: type)
        }
    }
    
    func _handleVibrationMessage(vibrationMessage: VibrationMessage) throws {
        print(vibrationMessage)
        onVibrationMessage?(vibrationMessage)
    }
    
    /// Defines the message sent to the connected Phone, such that it acknowledges the connection as established.
    func getHandshakeMessage() -> String {
        return "HANDSHAKE"
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
