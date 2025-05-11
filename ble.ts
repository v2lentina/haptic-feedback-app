// ble.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager } from 'react-native-ble-plx';

export const manager = new BleManager();
export const SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
export const CHAR_UUID    = '19b10002-e8f2-537e-4f6c-d104768a1214';

export const LAST_DEVICE_KEY = 'lastDeviceId';
export async function getLastDevice()   { return AsyncStorage.getItem(LAST_DEVICE_KEY); }
export async function saveLastDevice(id: string) { return AsyncStorage.setItem(LAST_DEVICE_KEY, id); }
export async function clearLastDevice() { return AsyncStorage.removeItem(LAST_DEVICE_KEY); }
