import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { addEventListener, requestBluetoothPermission, setServices, startAdvertising, stopAdvertising, updateCharacteristicValue } from 'munim-bluetooth';
import { ProtocolMessage } from './protocol';
// global.Buffer = global.Buffer || Buffer;

/** Service UUID for peripherals that support peripheral mode */
export const SEARCHING_FOR_SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
/** Characteristic UUID for peripherals that support peripheral mode */
export const SEARCHING_FOR_CHARACTERISTIC_UUID = '19b10002-e8f2-537e-4f6c-d104768a1214';

/** Service UUID to emit for peripherals in central mode to connect to */
export const EMITTING_SERVICE_UUID = "F89D9611-39A3-4777-868D-FB31E94B382A";
export const EMITTING_CHARACTERISTIC_UUID = "40489038-888A-4BFB-9C4B-11660B9B6BE0";
const LAST_DEVICE_KEY = 'lastDeviceId';

type MessageEventHandler = (msg: string, deviceId: string) => void | Promise<void>;

export type BleDevice = {
    /** A way to identify multiple BleDevices, can either be arbitrary or the Bluetooth-MAC */
    id: string;
    name: string | null;
}

/** Allows for establishing a connection with another device and receiving and sending string messages.
 * 
 * For anything protocol related see [`protocol.ts`](./protocol.ts)
 */
export class BleManager {
    // TODO: store identifier of device
    connectedDevice: BleDevice | null = null;

    messageListeners: Set<MessageEventHandler> = new Set<MessageEventHandler>();

    // TODO: Keep a map of id and connected device to be able to connect multiple devices.

    onMessage(callback: MessageEventHandler) {
        this.messageListeners = this.messageListeners.add(callback);
    }
    stopOnMessage(callback: MessageEventHandler) {
        this.messageListeners.delete(callback);
    }

    constructor() {
        console.log("BleManager created");
    }

    requestPermissions() {
        console.log("requesting Permissions")
        return requestBluetoothPermission();
    }

    handleHandshake(msg: ProtocolMessage, deviceId: string) {
        // TODO: indicate in the UI that an connection has been established
        // TODO: stop BLE advertising
        this.connectedDevice = {
            name: msg.body as string,
            id: deviceId,
        }
    }

    async advertise() {
        console.info("Starting advertising");

        // TODO: somehow check from which device the message came from (using the device map)
        addEventListener('peripheralWriteRequest', ({ centralId, value }: { centralId: string, value: string }) => {
            const msg = Buffer.from(value, "hex").toString();
            console.log('Peer wrote', centralId, msg);
            this.messageListeners.forEach(eh => eh(msg, centralId));
        })

        console.debug("setting services");
        setServices([{
            uuid: EMITTING_SERVICE_UUID,
            characteristics: [{
                uuid: EMITTING_CHARACTERISTIC_UUID,
                properties: ['read', 'write', 'notify'],
            }],
        }]);

        console.debug("Starting advertising");
        startAdvertising({
            serviceUUIDs: [EMITTING_SERVICE_UUID],
            localName: 'HFA', // not to be confused with L-FA ;-)

            // // manufacturerId is handled by HybridMunimBluetooth.kt:812
            // // there it has a 00 00 pad on the left, for reasons unclear to me
            // // if you want the manufacturing data to be exactly what you specify, change that there!
            // manufacturerData: this.companyId, // little endian (byte-level reversed)
            // advertisingData: {
            //     completeLocalName: "HFA",
            //     shortenedLocalName: "HFA",
            // }
        });

    }

    stopAdvertise() {
        stopAdvertising();
    }

    async getConnectedDevices() {
        if (!this.connectedDevice) return [];
        return [this.connectedDevice];
    }

    /** Sends a `message`.
     *
     * Resolves after the send was successful (doesn't necessarily mean that the transmission was successful) */
    async send(
        // TODO: require device identifier to support multiple devices (if null do a broadcast to all connected devices)
        message: string
    ): Promise<void> {
        updateCharacteristicValue(EMITTING_SERVICE_UUID, EMITTING_CHARACTERISTIC_UUID, Buffer.from(message).toString("hex"), true);
    }

    /** Waits for a response */
    async nextMessage(): Promise<string> {
        return new Promise<string>((resolve, reject) => {

            const nextMsg = (message: string) => {
                resolve(message);
                this.messageListeners.delete(nextMsg);
            }

            this.onMessage(nextMsg);
        });
    }
}

//helper functions
export async function getLastDevice() { return AsyncStorage.getItem(LAST_DEVICE_KEY); }
export async function saveLastDevice(id: string) { return AsyncStorage.setItem(LAST_DEVICE_KEY, id); }
export async function clearLastDevice() { return AsyncStorage.removeItem(LAST_DEVICE_KEY); }
// Functions that use PLX package, retained for future backwards-compatibility
export let reconnecting = false;
// export async function softReconnect(deviceId: string) {
//     if (reconnecting) return;
//     reconnecting = true;
//     try {
//         await manager.cancelDeviceConnection(deviceId);
//         const dev = await manager.connectToDevice(deviceId, { timeout: 8000 });
//         await dev.discoverAllServicesAndCharacteristics();
//         await saveLastDevice(deviceId);
//     } catch (e) {
//         console.warn("BLE> Soft-Reconnect failed", e);
//     }
//     reconnecting = false;
// }
//
// let writeQueue: Promise<any> = Promise.resolve();
// let writeCount = 0;
// const RECONNECT_EVERY = 5; //soft reconnect after every 5 vibrations
//
// export async function vibrate(pattern: VibrationPattern) {
// 	const devs = await manager.connectedDevices([SEARCHING_FOR_SERVICE_UUID]);
// 	if (!devs.length) return;
// 	const deviceId = devs[0].id;
// 	const data = Buffer.from(pattern).toString('base64');
// 	try {
// 		await enqueueVibration(deviceId, data);
// 	} catch (e) {
// 		console.warn('BLE> Sending vibration pattern failed', e);
// 	}
// }
//
// export function enqueueVibration(deviceId: string, payloadBase64: string) {
//     writeQueue = writeQueue
//         .catch(() => { })
//         .then(() => {
//             return manager.writeCharacteristicWithResponseForDevice(
//                 deviceId, SEARCHING_FOR_SERVICE_UUID, SEARCHING_FOR_CHARACTERISTIC_UUID, payloadBase64
//             );
//         })
//         .then(() => {
//             writeCount++;
//             if (writeCount >= RECONNECT_EVERY) {
//                 writeCount = 0;
//                 return softReconnect(deviceId);
//             }
//         })
//         .then(() => new Promise<void>(res => setTimeout(() => res(), 50)));
//     return writeQueue;
// }