import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

export const manager = new BleManager();
export const SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
export const CHAR_UUID    = '19b10002-e8f2-537e-4f6c-d104768a1214';
const LAST_DEVICE_KEY = 'lastDeviceId';

//helper functions
export async function getLastDevice()   { return AsyncStorage.getItem(LAST_DEVICE_KEY); }
export async function saveLastDevice(id: string) { return AsyncStorage.setItem(LAST_DEVICE_KEY, id); }
export async function clearLastDevice() { return AsyncStorage.removeItem(LAST_DEVICE_KEY); }
export let reconnecting = false;
export async function softReconnect(deviceId: string) {
    if (reconnecting) return;
    reconnecting = true;
    try {
        await manager.cancelDeviceConnection(deviceId);
        const dev = await manager.connectToDevice(deviceId, { timeout: 8000 });
        await dev.discoverAllServicesAndCharacteristics();
        await saveLastDevice(deviceId);
    } catch (e) {
        console.warn("Soft-Reconnect fehlgeschlagen", e);
    }
    reconnecting = false;
}

let writeQueue: Promise<any> = Promise.resolve();
let writeCount = 0;
const RECONNECT_EVERY = 5; //soft reconnect after every 5 vibrations

export function enqueueVibration(deviceId: string, payloadBase64: string) {
    writeQueue = writeQueue
        .catch(() => {})
        .then(() => {
            return manager.writeCharacteristicWithResponseForDevice(
                deviceId, SERVICE_UUID, CHAR_UUID, payloadBase64
            );
        })
        .then(() => {
            writeCount++;
            if (writeCount >= RECONNECT_EVERY) {
                writeCount = 0;
                return softReconnect(deviceId);
            }
        })
        .then(() => new Promise(res => setTimeout(res, 50)));
    return writeQueue;
}

export async function vibrate(code: number) {
    const devs = await manager.connectedDevices([SERVICE_UUID]);
    if (!devs.length) return;
    const deviceId = devs[0].id;
    const data = Buffer.from([code]).toString('base64');
    try {
        await enqueueVibration(deviceId, data);
    } catch(e) {
        console.warn('Buzz failed', e);
    }
}
