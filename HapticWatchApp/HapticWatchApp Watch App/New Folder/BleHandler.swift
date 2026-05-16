//
//  BleHandler.swift
//  HapticWatchApp
//
//  Created by Felix on 24.04.26.
//

import Foundation
import CoreBluetooth
import Combine

var supportsHaptics: Bool = false


class BleMessage {
    init(type: String, body: String) {
        self.type = type
        self.body = body
    }
    
    final var type: String;
    final var body: String;
}

class BLECentralManager: NSObject, ObservableObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    // This property is observed by the SwiftUI View
    @Published var statusMessage: String = "Initializing..."
    
    /// True if a phone is connected and ready for communication
    @Published var isConnected: Bool = false
    
    var onConnected: (() async -> Void)?
    
    var connectedPhone: CBPeripheral?
    
    /// A stream of all messages received from [connectedPhone]
    final var responseStream = PassthroughSubject<String, Never>()
    
    /// Reference to the [CBCharacteristic] that's used for reading
    private var targetCharacteristic: CBCharacteristic?

    
    private var centralManager: CBCentralManager!
    
    // The UUID your external hardware is advertising
    private let targetServiceUUID = CBUUID(string: "F89D9611-39A3-4777-868D-FB31E94B382A")
    private let targetCharacteristicUUID = CBUUID(string: "40489038-888A-4BFB-9C4B-11660B9B6BE0")
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
        print(centralManager.state)
    }
    
    /// On bluetooth state changed
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        guard central.state == .poweredOn else {
            print("BLE is unavailable or powered off.")

            DispatchQueue.main.async {self.statusMessage = "Bluetooth is Off"}
            
            return
        }
        
        startScan()
    }
    
    func startScan() {
        print("BLE is unavailable or powered off.")

        DispatchQueue.main.async { self.statusMessage = "Bluetooth is Off" }
        guard centralManager.state == .poweredOn else {
            return
        }
        
        print("BLE Powered On. Scanning for peripheral...")
        DispatchQueue.main.async { self.statusMessage = "Scanning for peripheral..." }
        
        // Watch scans for the target UUID instead of advertising
        centralManager.scanForPeripherals(withServices: [targetServiceUUID], options: nil)
    }
    
    /// On device discovered
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        print("Discovered target peripheral: \(peripheral.identifier.uuidString)")
        DispatchQueue.main.async {self.statusMessage = "Discovered target peripheral: \(peripheral.name ?? "UNKNOWN")"}
        centralManager.stopScan()
        
        self.connectedPhone = peripheral
        centralManager.connect(peripheral, options: nil)
    }
    
    /// On device connected
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        guard connectedPhone != nil else {
            print("Error connecting... 'connectedPhone' wasn't set!")
            return
        }
        
        print("Successfully connected to peripheral!")
        DispatchQueue.main.async {self.statusMessage = "Successfully connected to \(peripheral.name ?? "UNKNOWN")"}
        
        connectedPhone!.delegate = self
        connectedPhone!.discoverServices([targetServiceUUID])
    }
    
    /// On [CBService] discovered
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let services = peripheral.services, error == nil else {
            print("Error discovering services: \(String(describing: error))")
            return
        }
        
        for service in services {
            if service.uuid == targetServiceUUID {
                print("Found target service. Discovering characteristics...")
                peripheral.discoverCharacteristics([targetCharacteristicUUID], for: service)
            }
        }
    }
    
    /// [CBCharacteristic] found
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard let characteristics = service.characteristics, error == nil else { return }
        
        for characteristic in characteristics {
            if characteristic.uuid == targetCharacteristicUUID {
                print("Found target characteristic!")
                
                // Save reference for later writing
                self.targetCharacteristic = characteristic
                
                // To make the phone push data to the watch automatically:
                if characteristic.properties.contains(.notify) {
                    peripheral.setNotifyValue(true, for: characteristic)
                }
                
                isConnected = true
                
                Task {
                    await onConnected?()
                }
            }
        }
    }
    
    func sendData(stringMessage: String) {
        guard let peripheral = self.connectedPhone,
              let characteristic = self.targetCharacteristic else {
            print("Not connected or characteristic not found.")
            return
        }
        
        let dataPayload = Data(stringMessage.utf8)
        
        // Check what the characteristic allows
        let writeType: CBCharacteristicWriteType = characteristic.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        
        peripheral.writeValue(dataPayload, for: characteristic, type: writeType)
        print("Data sent: \(stringMessage)")
    }
    
    func waitForData() -> Future<String, Never> {
        return Future() { promise in
            _ = self.responseStream
                .first()
                .sink { msg in
                promise(Result<String, Never>.success(msg))
            }
        }
    }
    
    // receive data from characteristic
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let data = characteristic.value, error == nil else {
            print("Error reading data: \(String(describing: error))")
            return
        }
        
        // Decode the data buffer back into a usable format
        if let receivedString = String(data: data, encoding: .utf8) {
            print("Received from phone: \(receivedString)")
            responseStream.send(receivedString)
            self.statusMessage = "Connection complete"
        }
    }
}
