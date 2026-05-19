import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext, useEffect, useState,
} from 'react';
import type { Device, State, Subscription } from 'react-native-ble-plx';
import { clearLastDevice, getLastDevice, manager, reconnecting, saveLastDevice, SEARCHING_FOR_SERVICE_UUID } from './ble.ts';

interface BleContextValue {
    bleState: State | null;
    devices: Device[];
    connectedDevice: Device | null;
    isScanning: boolean;
    isAdvertising: boolean;
    advertiseService: () => void;
    stopAdvertise: () => void;
    send: (message:string) => Promise<void>;
    getConnectedDevices: () => Promise<Device[]>;
    scanForDevices: () => void;
    connect: (device: Device) => void;
    disconnect: () => void;
}

const BleContext = createContext<BleContextValue | undefined>(undefined);

export function BleProvider({ children }: { children: ReactNode }) {

    // console.log("manager: " + manager.requestPermissions);

    const [bleState, setBleState] = useState<State | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isAdvertising, setIsAdvertising] = useState(false);
    // TODO: Doesn't a useRef suffice??
    const [disconnectSub, setDisconnectSub] = useState<Subscription | null>(null);

    useEffect(() => {
        const sub = manager.onStateChange(async (state) => {
            setBleState(state);
            if (state === 'PoweredOn') {
                const lastId = await getLastDevice();
                if (lastId) {
                    try {
                        const dev = await manager.connectToDevice(lastId);
                        handleConnect(dev);
                    } catch { }
                }
            }
        }, true);
        return () => sub.remove();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            const current = await manager.connectedDevices([SEARCHING_FOR_SERVICE_UUID]);
            if (current.length > 0) {
                if (!connectedDevice || connectedDevice.id !== current[0].id) {
                    setConnectedDevice(current[0]);
                    await saveLastDevice(current[0].id);
                }
            } else if (connectedDevice) {
                setConnectedDevice(null);
                await clearLastDevice();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [connectedDevice]);

    const scanForDevices = useCallback(() => {
        if (bleState !== 'PoweredOn' || isScanning) return;
        setIsScanning(true);
        setDevices([]);
        manager.startDeviceScan(
            [SEARCHING_FOR_SERVICE_UUID],
            { allowDuplicates: false },
            (err, dev) => {
                if (err) {
                    console.warn('Scan-Error', err);
                    setIsScanning(false);
                    return;
                }
                if (dev && !devices.find(d => d.id === dev.id))
                    setDevices(d => [...d, dev]);
            }
        );
        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
        }, 6000);
    }, [bleState, isScanning, devices]);

    const advertiseService = useCallback(async() => {
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
    }, [bleState])

    const handleConnect = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();
        setConnectedDevice(device);
        await saveLastDevice(device.id);
        device.onDisconnected(() => {
            if (!reconnecting) {
            } setConnectedDevice(null);
            clearLastDevice();
        });
        if (disconnectSub) {
            disconnectSub.remove();
            setDisconnectSub(null);
        }
        await device.discoverAllServicesAndCharacteristics();
        setConnectedDevice(device);
        await saveLastDevice(device.id);

        const sub = device.onDisconnected(() => {
            sub.remove();
            setDisconnectSub(null);
            setConnectedDevice(null);
            clearLastDevice();
        });
        setDisconnectSub(sub);
    };


    const connect = useCallback(async (device: Device) => {
        try {
            const dev = await manager.connectToDevice(device.id, { timeout: 8000 });
            handleConnect(dev);
        } catch (e) {
            console.error('Connect-Error', e);
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (!connectedDevice) return;
        try {
            await connectedDevice.cancelConnection();
        } catch { }
        setConnectedDevice(null);
        clearLastDevice();
    }, [connectedDevice]);

    const send = useCallback(async (message: string) => {
        if (bleState !== 'PoweredOn' || isAdvertising) return;

        return await manager.sendToDevice(message);
    }, [bleState])

    return (
        <BleContext.Provider
            value={{ bleState, devices, connectedDevice, isScanning, isAdvertising, advertiseService, stopAdvertise, send, getConnectedDevices, scanForDevices, connect, disconnect }}
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
