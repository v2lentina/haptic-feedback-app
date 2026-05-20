import { VibrationPattern } from "./vibrationPatterns";

/** All valid values for `type` in a JSON message */
const VALID_TYPES = ['VIBRATION', 'HANDSHAKE', 'OTHER'];


/** The data of a messag */
type ProtocolMessagePayload = {
	type: 'VIBRATION' | 'HANDSHAKE' | 'OTHER';
	body: VibrationPattern | string,
}

/** Data only required by the protocol, that doesn't have to do with the payload */
type ProtocolMessageMetadata = {
	// /** Identifies a request/response pair, by having an equal id */
	// id: number;
}

/** How a message in the protocol looks like, as response and request when received or when it is sent */
export type ProtocolMessage = ProtocolMessagePayload & ProtocolMessageMetadata;

export type ProtocolMessageHandler = (message: ProtocolMessage) => void | Promise<void>;

type ActionMap = {
	[key: typeof ProtocolMessage['type']]: ProtocolMessageHandler;
}

/** Defines how a received message should be interpreted
 *
 * See [`protocol.md`](../protocol.md) for details.
 * @param msg
 * @param actionMap A map where each key corresponds to a valid type of a {@link ProtocolMessage}
 * @throws {ProtocolException} If the protocol is violated in syntax (Format, literals, size limits, value types)
 */
export function handleMessage(msg: string, deviceId: string, actionMap: ActionMap) {
	const msgObject = JSON.parse(msg);

	if (!msgObject['type'] || !msgObject['body']) {
		throw new ProtocolException(msg, `Message didn't have 'type' and 'body' properties`);
	}

	if (!VALID_TYPES.includes(msgObject['type'])) {
		return new ProtocolException(msg, `Message.type was not an allowed value: ${JSON.stringify(VALID_TYPES)}`);
	}

	const action = actionMap[msgObject['type']];

	if (!action) throw ProtocolError({ actionMap, msgObject }, `actionMap did not have an entry for '${msgObject['type']}'`);

	return action(msgObject as ProtocolMessage, deviceId);
}

// /** Generates an ID unique for at least one minute
//  * 
//  * ie. The same messageID ***may*** be generated a minute from this generation
//  * 
//  * The reason for this, is to refrain from sending very large ID numbers with every message,
//  * BLE messages have a limited payload size */
// function generateMessageID() {
// 	return new Date().getTime() % (1000 /* 1s */ * 60 /* 1min */);
// }

// export type MessageMedium = {
// 	sendData: (msg: string) => void | Promise<void>,
// 	onMessageReceived: (listener: (msg: string) => any) => object,
// 	removeListener: (listenerID: object) => void
// }

// /** Sends a request and waits for its response via given `medium`.
//  * 
//  * A `medium` has to provide means by which to send and listening for incoming messages and stop listening.
//  * 
//  * @param request The contents of the request message. As this is a protocol level request, any protocol required data get's added. Namely `id` (by {@link generateMessageID})
//  */
// export function request(
// 	request: ProtocolMessagePayload,
// 	medium: MessageMedium
// ): Promise<string> {
// 	return new Promise<string>((resolve, reject) => {
// 		const constructedMessage = {
// 			...request,
// 			id: generateMessageID(),
// 		};

// 		// send is happening async, without await, shouldn't pose a problem
// 		sendData(JSON.stringify(constructedMessage));

// 		const listenerID = await onMessageReceived((msg: string) => {
// 			const msgObj = JSON.parse(msg);
// 			const receivedID = msg['id'];

// 			if (receivedID == constructedMessage.id) {
// 				removeListener(listenerID);
// 			}
// 		});
// 	});
// }

//#region Util

/** Follows dart naming convention:
 *
 * `Error`: Mistake made by the programmer  
 * `Exception`: Something that can always happen, and you should check for. */
export class Exception extends Error { }

/** Follows dart naming convention:
 *
 * `Error`: Mistake made by the programmer  
 * `Exception`: Something that can always happen, and you should check for. */
export class ProtocolException extends Exception {
	readonly context: string | object | undefined;

	constructor(context: string | object | undefined, message: string) {
		super(message);
		this.context = context;
	}
}

export class ProtocolError extends Error {
	readonly context: string | object | undefined;
	constructor(context: string | object | undefined, message: string) {
		super(message);
		this.context = context;
	}
}
//#endregion