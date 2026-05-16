import type { AdvertisingDataTypes, BLEDevice, ScanOptions, GATTService, CharacteristicValue } from './specs/munim-bluetooth.nitro';
/**
 * Start advertising as a Bluetooth peripheral with supported advertising data.
 *
 * @param options - An object with serviceUUIDs (string[]) and supported advertising data types.
 */
export declare function startAdvertising(options: {
    serviceUUIDs: string[];
    localName?: string;
    manufacturerData?: string;
    advertisingData?: AdvertisingDataTypes;
}): void;
/**
 * Update advertising data while advertising is active.
 *
 * @param advertisingData - The new advertising data to use.
 */
export declare function updateAdvertisingData(advertisingData: AdvertisingDataTypes): void;
/**
 * Get current advertising data.
 *
 * @returns Promise resolving to current advertising data.
 */
export declare function getAdvertisingData(): Promise<AdvertisingDataTypes>;
/**
 * Stop BLE advertising.
 */
export declare function stopAdvertising(): void;
/**
 * Set GATT services and characteristics for the Bluetooth peripheral.
 *
 * @param services - An array of service objects, each with a uuid and an array of characteristics.
 */
export declare function setServices(services: GATTService[]): void;
/**
 * Check if Bluetooth is enabled on the device.
 *
 * @returns Promise resolving to true if Bluetooth is enabled, false otherwise.
 */
export declare function isBluetoothEnabled(): Promise<boolean>;
/**
 * Request Bluetooth permissions (Android) or check authorization status (iOS).
 *
 * @returns Promise resolving to true if permissions are granted, false otherwise.
 */
export declare function requestBluetoothPermission(): Promise<boolean>;
/**
 * Start scanning for BLE devices.
 *
 * @param options - Optional scan configuration including service UUIDs to filter by.
 */
export declare function startScan(options?: ScanOptions): void;
/**
 * Stop scanning for BLE devices.
 */
export declare function stopScan(): void;
/**
 * Connect to a BLE device.
 *
 * @param deviceId - The unique identifier of the device to connect to.
 * @returns Promise resolving when connection is established or rejected.
 */
export declare function connect(deviceId: string): Promise<void>;
/**
 * Disconnect from a BLE device.
 *
 * @param deviceId - The unique identifier of the device to disconnect from.
 */
export declare function disconnect(deviceId: string): void;
/**
 * Discover GATT services for a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @returns Promise resolving to array of discovered services.
 */
export declare function discoverServices(deviceId: string): Promise<GATTService[]>;
/**
 * Read a characteristic value from a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to read.
 * @returns Promise resolving to the characteristic value.
 */
export declare function readCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<CharacteristicValue>;
/**
 * Write a value to a characteristic on a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to write.
 * @param value - The value to write (hex string).
 * @param writeType - Optional write type: 'write' or 'writeWithoutResponse'. Defaults to 'write'.
 * @returns Promise resolving when write is complete.
 */
export declare function writeCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string, value: string, writeType?: 'write' | 'writeWithoutResponse'): Promise<void>;
/**
 * Subscribe to notifications/indications from a characteristic.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to subscribe to.
 */
export declare function subscribeToCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string): void;
/**
 * Unsubscribe from notifications/indications from a characteristic.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to unsubscribe from.
 */
export declare function unsubscribeFromCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string): void;
/**
 * Get list of currently connected devices.
 *
 * @returns Promise resolving to array of connected device IDs.
 */
export declare function getConnectedDevices(): Promise<string[]>;
/**
 * Read RSSI (signal strength) for a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @returns Promise resolving to RSSI value in dBm.
 */
export declare function readRSSI(deviceId: string): Promise<number>;
/**
 * Add a device found event listener (for scanning).
 *
 * @param callback - Function to call when a device is found
 * @returns A function to remove the listener
 */
export declare function addDeviceFoundListener(callback: (device: BLEDevice) => void): () => void;
/**
 * Add an event listener.
 *
 * @param eventName - The name of the event to listen for.
 * @param callback - The callback to invoke when the event occurs.
 * @returns A function to remove the listener
 */
export declare function addEventListener(eventName: string, callback: (data: any) => void): () => void;
/**
 * Add an event listener (legacy method).
 *
 * @param eventName - The name of the event to listen for.
 */
export declare function addListener(eventName: string): void;
/**
 * Remove event listeners.
 *
 * @param count - Number of listeners to remove.
 */
export declare function removeListeners(count: number): void;
export type { AdvertisingDataTypes, BLEDevice, ScanOptions, GATTService, CharacteristicValue, };
declare const _default: {
    startAdvertising: typeof startAdvertising;
    stopAdvertising: typeof stopAdvertising;
    updateAdvertisingData: typeof updateAdvertisingData;
    getAdvertisingData: typeof getAdvertisingData;
    setServices: typeof setServices;
    isBluetoothEnabled: typeof isBluetoothEnabled;
    requestBluetoothPermission: typeof requestBluetoothPermission;
    startScan: typeof startScan;
    stopScan: typeof stopScan;
    connect: typeof connect;
    disconnect: typeof disconnect;
    discoverServices: typeof discoverServices;
    readCharacteristic: typeof readCharacteristic;
    writeCharacteristic: typeof writeCharacteristic;
    subscribeToCharacteristic: typeof subscribeToCharacteristic;
    unsubscribeFromCharacteristic: typeof unsubscribeFromCharacteristic;
    getConnectedDevices: typeof getConnectedDevices;
    readRSSI: typeof readRSSI;
    addDeviceFoundListener: typeof addDeviceFoundListener;
    addEventListener: typeof addEventListener;
    addListener: typeof addListener;
    removeListeners: typeof removeListeners;
};
export default _default;
//# sourceMappingURL=index.d.ts.map