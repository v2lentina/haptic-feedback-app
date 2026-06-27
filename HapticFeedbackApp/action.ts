// Defines all actions that can be triggerd via the protocol
//
// This is Business Logic Level

import { ProtocolException, ProtocolMessage } from "./protocol";
import { VibrationPattern } from "./vibrationPatterns";

export async function sendVibrationPattern(pattern: VibrationPattern, { send }: { send: (msg: string) => void | Promise<void> }) {
	const messageObj = {
		type: 'VIBRATION',
		body: pattern,
	}

	await send(JSON.stringify(messageObj));

	// const response = await request(messageObj, mediumFromBle(ble));
}

export async function sendStart({ send }: { send: (msg: string) => void | Promise<void> }, body: String | undefined) {
	console.log("sending START message");
	const messageObj = {
		type: 'START',
		body: body ?? "START"
	}
	
	await send(JSON.stringify(messageObj));
}

export async function sendStop({ send }: { send: (msg: string) => void | Promise<void> }, body: String | undefined) {
	console.log("sending STOP message");
	const messageObj = {
		type: 'STOP',
		body: body ?? "STOP"
	}

	await send(JSON.stringify(messageObj));
}

// export function mediumFromBle(ble: BleManager): MessageMedium {
// 	return {
// 		sendData(msg) {
// 			return ble.sendToDevice(msg);
// 		},
// 		onMessageReceived(listener) {
// 			ble.onMessage(listener)
// 			return listener;
// 		},
// 		removeListener(listenerID) {
// 			ble.stopOnMessage(listener)
// 		},
// 	} as MessageMedium;
// }

//#region Handlers
export function handleVibration(msg: ProtocolMessage) {
	throw new ProtocolException(msg, `Must not play vibration on the phone`);
}

export function handleOther(msg: ProtocolMessage) {
	// implement any special messages here

	// default case
	throw new ProtocolException(msg, `Unknown message`);
}
//#endregion