import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { setServices, startAdvertising, stopAdvertising } from 'munim-bluetooth';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager as BlePlxManager } from 'react-native-ble-plx';
global.Buffer = global.Buffer || Buffer;

export const SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
export const CHAR_UUID = '19b10002-e8f2-537e-4f6c-d104768a1214';
const LAST_DEVICE_KEY = 'lastDeviceId';

/**
 * Allows for both advertising and scanning using `plx` and `advertise`
 */
export class BleManager extends BlePlxManager {
    companyId = 0x2026; // special id for development
    uuid = "F89D9611-39A3-4777-868D-FB31E94B382A";
    major = 0x0; // tbh I don't know what these are for...
    minor = 0x0; // tbh I don't know what these are for...

    constructor() {
        super();
        console.log("Custom BleManager created.");
    }

    requestPermissions() {
        if (Platform.OS === 'android') {
            const permissionsRequiredToBeAccepted = [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ];


            return PermissionsAndroid.requestMultiple(permissionsRequiredToBeAccepted);
        }

        // nothing to request on iOS
        return Promise.resolve(true);
    }

    advertise() {
        setServices([{
            uuid: this.uuid,
            characteristics: [{
                uuid: this.uuid,
                properties: [],
            }],
        }])

        console.log("Change-3");

        startAdvertising({
            serviceUUIDs: [this.uuid],
            // localName: 'FFFF', // not to be confused with L-FA
            manufacturerData: "FFFF",
            advertisingData: {
                // appearance: this.companyId,
                // manufacturerId is handled by HybridMunimBluetooth.kt:812
                manufacturerData: "FFFF",
                // completeLocalName: "FFFA",
                // shortenedLocalName: "FA",
            }
        });

        // BleAdvertise.setCompanyId(this.companyId);

        // BleAdvertise.broadcast(this.uuid, this.major, this.minor)
        //     .then(_success => {
        //         console.log('broadcast started');
        //     }).catch(error => {
        //         console.log('broadcast failed with: ' + error);
        //     });
    }

    async getConnectedDevices() {
        const connectedDevices = await this.connectedDevices([this.uuid]);
        return connectedDevices
    }

    stopAdvertise() {
        stopAdvertising();
        // BleAdvertise.stopBroadcast()
        //     .then(_success => {
        //         console.log('broadcast stopped');
        //     }).catch(error => {
        //         console.log('broadcast failed to stop with: ' + error);
        //     });
    }
}

export const manager = new BleManager();

//helper functions
export async function getLastDevice() { return AsyncStorage.getItem(LAST_DEVICE_KEY); }
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
        console.warn("BLE> Soft-Reconnect failed", e);
    }
    reconnecting = false;
}

let writeQueue: Promise<any> = Promise.resolve();
let writeCount = 0;
const RECONNECT_EVERY = 5; //soft reconnect after every 5 vibrations

export function enqueueVibration(deviceId: string, payloadBase64: string) {
    writeQueue = writeQueue
        .catch(() => { })
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

export async function vibrate(pattern: VibrationPatterns) {
    const devs = await manager.connectedDevices([SERVICE_UUID]);
    if (!devs.length) return;
    const deviceId = devs[0].id;
    const data = Buffer.from(pattern).toString('base64');
    try {
        await enqueueVibration(deviceId, data);
    } catch (e) {
        console.warn('BLE> Sending vibration pattern failed', e);
    }
}
