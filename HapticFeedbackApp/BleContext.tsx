import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState
} from 'react';
import type { State, Subscription } from 'react-native-ble-plx';
import { handleOther, handleVibration, sendVibrationPattern } from './action.ts';
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
    vibrate: (pattern: VibrationPattern) => Promise<void>
    getConnectedDevices: () => Promise<BleDevice[]>;
    disconnect: () => void;
}

const BleContext = createContext<BleContextValue | undefined>(undefined);


export function BleProvider({ children }: { children: ReactNode }) {
    const manager = new BleManager();
    manager.onMessage((msg, deviceId) => {
        handleMessage(msg, deviceId, {
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

    const [bleState, setBleState] = useState<State | null>(null);
    const [devices, setDevices] = useState<BleDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<BleDevice | null>(null);
    const [isAdvertising, setIsAdvertising] = useState(false);
    // TODO: Doesn't a useRef suffice??
    const [disconnectSub, setDisconnectSub] = useState<Subscription | null>(null);

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

    return (
        <BleContext.Provider
            value={{ bleState, devices, connectedDevice, isAdvertising, advertiseService, stopAdvertise, send, vibrate, getConnectedDevices, disconnect }}
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
