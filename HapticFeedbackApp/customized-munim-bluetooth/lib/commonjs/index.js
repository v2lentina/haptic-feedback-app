"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addDeviceFoundListener = addDeviceFoundListener;
exports.addEventListener = addEventListener;
exports.addListener = addListener;
exports.connect = connect;
exports.default = void 0;
exports.disconnect = disconnect;
exports.discoverServices = discoverServices;
exports.getAdvertisingData = getAdvertisingData;
exports.getConnectedDevices = getConnectedDevices;
exports.isBluetoothEnabled = isBluetoothEnabled;
exports.readCharacteristic = readCharacteristic;
exports.readRSSI = readRSSI;
exports.removeListeners = removeListeners;
exports.requestBluetoothPermission = requestBluetoothPermission;
exports.setServices = setServices;
exports.startAdvertising = startAdvertising;
exports.startScan = startScan;
exports.stopAdvertising = stopAdvertising;
exports.stopScan = stopScan;
exports.subscribeToCharacteristic = subscribeToCharacteristic;
exports.unsubscribeFromCharacteristic = unsubscribeFromCharacteristic;
exports.updateAdvertisingData = updateAdvertisingData;
exports.writeCharacteristic = writeCharacteristic;
var _reactNativeNitroModules = require("react-native-nitro-modules");
var _reactNative = require("react-native");
const MunimBluetooth = _reactNativeNitroModules.NitroModules.createHybridObject('MunimBluetooth');

// Android emits through DeviceEventEmitter from the Nitro module itself.
// iOS exposes a dedicated RCTEventEmitter module.
const nativeEventModule = _reactNative.Platform.OS === 'ios' ? _reactNative.NativeModules.MunimBluetoothEventEmitter : null;
console.log('[munim-bluetooth] Checking for event emitter...', _reactNative.Platform.OS === 'android' ? 'USING_DEVICE_EVENT_EMITTER' : nativeEventModule ? 'FOUND' : 'NOT FOUND');
console.log('[munim-bluetooth] Available NativeModules:', Object.keys(_reactNative.NativeModules).filter(key => key.includes('Bluetooth') || key.includes('Munim')));
let eventEmitter = null;
if (_reactNative.Platform.OS === 'android') {
  eventEmitter = _reactNative.DeviceEventEmitter;
  console.log('[munim-bluetooth] Using DeviceEventEmitter on Android');
} else if (nativeEventModule) {
  try {
    eventEmitter = new _reactNative.NativeEventEmitter(nativeEventModule);
    console.log('[munim-bluetooth] Event emitter initialized successfully');
  } catch (error) {
    console.error('[munim-bluetooth] Failed to initialize event emitter:', error);
  }
} else {
  console.warn('[munim-bluetooth] Event emitter module not found in NativeModules - device discovery events will not work');
  console.warn('[munim-bluetooth] This usually means the native module was not linked properly or needs a rebuild');
}

// ========== Peripheral Features ==========

/**
 * Start advertising as a Bluetooth peripheral with supported advertising data.
 *
 * @param options - An object with serviceUUIDs (string[]) and supported advertising data types.
 */
function startAdvertising(options) {
  return MunimBluetooth.startAdvertising(options);
}

/**
 * Update advertising data while advertising is active.
 *
 * @param advertisingData - The new advertising data to use.
 */
function updateAdvertisingData(advertisingData) {
  return MunimBluetooth.updateAdvertisingData(advertisingData);
}

/**
 * Get current advertising data.
 *
 * @returns Promise resolving to current advertising data.
 */
function getAdvertisingData() {
  return MunimBluetooth.getAdvertisingData();
}

/**
 * Stop BLE advertising.
 */
function stopAdvertising() {
  return MunimBluetooth.stopAdvertising();
}

/**
 * Set GATT services and characteristics for the Bluetooth peripheral.
 *
 * @param services - An array of service objects, each with a uuid and an array of characteristics.
 */
function setServices(services) {
  return MunimBluetooth.setServices(services);
}

// ========== Central/Manager Features ==========

/**
 * Check if Bluetooth is enabled on the device.
 *
 * @returns Promise resolving to true if Bluetooth is enabled, false otherwise.
 */
function isBluetoothEnabled() {
  return MunimBluetooth.isBluetoothEnabled();
}

/**
 * Request Bluetooth permissions (Android) or check authorization status (iOS).
 *
 * @returns Promise resolving to true if permissions are granted, false otherwise.
 */
function requestBluetoothPermission() {
  return MunimBluetooth.requestBluetoothPermission();
}

/**
 * Start scanning for BLE devices.
 *
 * @param options - Optional scan configuration including service UUIDs to filter by.
 */
function startScan(options) {
  return MunimBluetooth.startScan(options);
}

/**
 * Stop scanning for BLE devices.
 */
function stopScan() {
  return MunimBluetooth.stopScan();
}

/**
 * Connect to a BLE device.
 *
 * @param deviceId - The unique identifier of the device to connect to.
 * @returns Promise resolving when connection is established or rejected.
 */
function connect(deviceId) {
  return MunimBluetooth.connect(deviceId);
}

/**
 * Disconnect from a BLE device.
 *
 * @param deviceId - The unique identifier of the device to disconnect from.
 */
function disconnect(deviceId) {
  return MunimBluetooth.disconnect(deviceId);
}

/**
 * Discover GATT services for a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @returns Promise resolving to array of discovered services.
 */
function discoverServices(deviceId) {
  return MunimBluetooth.discoverServices(deviceId);
}

/**
 * Read a characteristic value from a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to read.
 * @returns Promise resolving to the characteristic value.
 */
function readCharacteristic(deviceId, serviceUUID, characteristicUUID) {
  return MunimBluetooth.readCharacteristic(deviceId, serviceUUID, characteristicUUID);
}

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
function writeCharacteristic(deviceId, serviceUUID, characteristicUUID, value, writeType) {
  return MunimBluetooth.writeCharacteristic(deviceId, serviceUUID, characteristicUUID, value, writeType);
}

/**
 * Subscribe to notifications/indications from a characteristic.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to subscribe to.
 */
function subscribeToCharacteristic(deviceId, serviceUUID, characteristicUUID) {
  return MunimBluetooth.subscribeToCharacteristic(deviceId, serviceUUID, characteristicUUID);
}

/**
 * Unsubscribe from notifications/indications from a characteristic.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param characteristicUUID - The UUID of the characteristic to unsubscribe from.
 */
function unsubscribeFromCharacteristic(deviceId, serviceUUID, characteristicUUID) {
  return MunimBluetooth.unsubscribeFromCharacteristic(deviceId, serviceUUID, characteristicUUID);
}

/**
 * Get list of currently connected devices.
 *
 * @returns Promise resolving to array of connected device IDs.
 */
function getConnectedDevices() {
  return MunimBluetooth.getConnectedDevices();
}

/**
 * Read RSSI (signal strength) for a connected device.
 *
 * @param deviceId - The unique identifier of the connected device.
 * @returns Promise resolving to RSSI value in dBm.
 */
function readRSSI(deviceId) {
  return MunimBluetooth.readRSSI(deviceId);
}

// ========== Event Management ==========

/**
 * Add a device found event listener (for scanning).
 *
 * @param callback - Function to call when a device is found
 * @returns A function to remove the listener
 */
function addDeviceFoundListener(callback) {
  if (!eventEmitter) {
    console.warn('[munim-bluetooth] Cannot add listener - event emitter not available');
    return () => {};
  }
  const subscription = eventEmitter.addListener('deviceFound', callback);
  return () => subscription.remove();
}

/**
 * Add an event listener.
 *
 * @param eventName - The name of the event to listen for.
 * @param callback - The callback to invoke when the event occurs.
 * @returns A function to remove the listener
 */
function addEventListener(eventName, callback) {
  if (!eventEmitter) {
    console.warn('[munim-bluetooth] Cannot add listener - event emitter not available');
    return () => {};
  }
  const subscription = eventEmitter.addListener(eventName, callback);
  return () => subscription.remove();
}

/**
 * Add an event listener (legacy method).
 *
 * @param eventName - The name of the event to listen for.
 */
function addListener(eventName) {
  return MunimBluetooth.addListener(eventName);
}

/**
 * Remove event listeners.
 *
 * @param count - Number of listeners to remove.
 */
function removeListeners(count) {
  return MunimBluetooth.removeListeners(count);
}

// ========== Type Exports ==========
// Default export for convenience
var _default = exports.default = {
  // Peripheral
  startAdvertising,
  stopAdvertising,
  updateAdvertisingData,
  getAdvertisingData,
  setServices,
  // Central
  isBluetoothEnabled,
  requestBluetoothPermission,
  startScan,
  stopScan,
  connect,
  disconnect,
  discoverServices,
  readCharacteristic,
  writeCharacteristic,
  subscribeToCharacteristic,
  unsubscribeFromCharacteristic,
  getConnectedDevices,
  readRSSI,
  // Events
  addDeviceFoundListener,
  addEventListener,
  addListener,
  removeListeners
};
//# sourceMappingURL=index.js.map