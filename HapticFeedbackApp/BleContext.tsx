import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState
} from 'react';
import type { State, Subscription } from 'react-native-ble-plx';
import { handleOther, handleVibration, sendStart, sendStop, sendVibrationPattern } from './action.ts';
import { BleDevice, BleManager, clearLastDevice } from './ble.ts';
import { handleMessage, ProtocolMessage } from './protocol.ts';
import { VibrationPattern } from './vibrationPatterns.ts';

interface BleContextValue {
    bleState: State | null;
    devices: BleDevice[];
    connectedDevice: BleDevice | null;
    isAdvertising: boolean;
    advertiseService: () => void;
    stopAdvertise: () => void;
    send: (message: string) => Promise<void>;
    vibrate: (pattern: VibrationPattern) => Promise<void>;
    startActivity: (body: String|undefined) => Promise<void>;
    stopActivity: (body: String|undefined) => Promise<void>;
    getConnectedDevices: () => Promise<BleDevice[]>;
    disconnect: () => void;
}

const BleContext = createContext<BleContextValue | undefined>(undefined);


export function BleProvider({ children }: { children: ReactNode }) {
    const manager = new BleManager();
    manager.onMessage((msg, deviceId) => {
        handleMessage(msg, deviceId, {
            "START": (msg: ProtocolMessage, deviceId: string) => {
                console.error("Shouldn't be sent to phone!")
            },
            "STOP": (msg: ProtocolMessage, deviceId: string) => {
                console.error("Shouldn't be sent to phone!")
            },
            "OTHER": handleOther,
            "VIBRATION": handleVibration,
            "HANDSHAKE": (msg: ProtocolMessage, deviceId: string) => {
                manager.handleHandshake(msg, deviceId);

                // indicate connection in UI
                setDevices([manager.connectedDevice!]);
                setConnectedDevice(manager.connectedDevice!);
                // stopAdvertise();
                // manager.stopDeviceScan();
            },
        })
    });

    // console.log("manager: " + manager.requestPermissions);

    const [bleState, setBleState] = useState<State | null>("PoweredOn");
    const [devices, setDevices] = useState<BleDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<BleDevice | null>(null);
    const [isAdvertising, setIsAdvertising] = useState(false);
    // TODO: Doesn't a useRef suffice??
    const [disconnectSub, setDisconnectSub] = useState<Subscription | null>(null);

    // useEffect(() => {
    //     const sub = manager.onStateChange(async (state) => {
    //         setBleState(state);
    //     }, true);
    //     return () => sub.remove();
    // }, []);

    const advertiseService = useCallback(async () => {
        await manager.requestPermissions();
        if (bleState !== 'PoweredOn' || isAdvertising) return;
        setIsAdvertising(true);
        await manager.advertise();
    }, [bleState, isAdvertising]);

    const stopAdvertise = useCallback(() => {
        if (bleState !== 'PoweredOn' || !isAdvertising) return;
        setIsAdvertising(false);
        manager.stopAdvertise();
    }, [bleState, isAdvertising]);

    const getConnectedDevices = useCallback(async () => {
        await manager.requestPermissions();
        if (bleState !== 'PoweredOn') return [];
        return await manager.getConnectedDevices();
    }, [bleState]);

    const disconnect = useCallback(async () => {
        if (!connectedDevice) return;
        setConnectedDevice(null);
        clearLastDevice();
    }, [connectedDevice]);

    const send = useCallback(async (message: string) => {
        if (bleState !== 'PoweredOn' || isAdvertising) return;

        return await manager.send(message);
    }, [bleState])

    const vibrate = useCallback(async (pattern: VibrationPattern) => {
        if (bleState !== 'PoweredOn' || isAdvertising) return;

        return sendVibrationPattern(pattern, { send: manager.send });
    }, [bleState]);

    const startActivity = useCallback(async (body: String | undefined) => {
        if (bleState !== 'PoweredOn' || isAdvertising) return;
        
        return sendStart({ send: manager.send }, body);
    }, [bleState]);

    const stopActivity = useCallback(async (body: String | undefined) => {
        if (bleState !== 'PoweredOn' || isAdvertising) return;
        
        return sendStop({ send: manager.send }, body);
    }, [bleState]);

    return (
        <BleContext.Provider
            value={{ bleState, devices, connectedDevice, isAdvertising, advertiseService, stopAdvertise, send, vibrate, startActivity, stopActivity, getConnectedDevices, disconnect }}
        >
            {children}
        </BleContext.Provider>
    );
};

export function useBle() {
    const ctx = useContext(BleContext);
    if (!ctx) throw new Error('useBle must be used inside BleProvider');
    return ctx;
}
