import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext, useEffect, useState,
} from 'react';
import type { Device, State, Subscription } from 'react-native-ble-plx';
import { clearLastDevice, getLastDevice, manager, reconnecting, saveLastDevice, SERVICE_UUID } from './ble.ts';

interface BleContextValue {
    bleState: State | null;
    devices: Device[];
    connected: Device | null;
    scanning: boolean;
    advertising: boolean;
    advertiseService: () => void;
    stopAdvertise: () => void;
    getConnectedDevices: () => Promise<Device[]>
    scanForDevices: () => void;
    connect: (device: Device) => void;
    disconnect: () => void;
}

const BleContext = createContext<BleContextValue | undefined>(undefined);

export function BleProvider({ children }: { children: ReactNode }) {

    console.log("manager: " + manager.requestPermissions);

    const [bleState, setBleState] = useState<State | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [connected, setConnected] = useState<Device | null>(null);
    const [scanning, setScanning] = useState(false);
    const [advertising, setAdvertising] = useState(false);
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
            const current = await manager.connectedDevices([SERVICE_UUID]);
            if (current.length > 0) {
                if (!connected || connected.id !== current[0].id) {
                    setConnected(current[0]);
                    await saveLastDevice(current[0].id);
                }
            } else if (connected) {
                setConnected(null);
                await clearLastDevice();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [connected]);

    const scanForDevices = useCallback(() => {
        if (bleState !== 'PoweredOn' || scanning) return;
        setScanning(true);
        setDevices([]);
        manager.startDeviceScan(
            [SERVICE_UUID],
            { allowDuplicates: false },
            (err, dev) => {
                if (err) {
                    console.warn('Scan-Error', err);
                    setScanning(false);
                    return;
                }
                if (dev && !devices.find(d => d.id === dev.id))
                    setDevices(d => [...d, dev]);
            }
        );
        setTimeout(() => {
            manager.stopDeviceScan();
            setScanning(false);
        }, 6000);
    }, [bleState, scanning, devices]);

    const advertiseService = useCallback(async() => {
        await manager.requestPermissions();
        if (bleState !== 'PoweredOn' || advertising) return;
        setAdvertising(true);
        await manager.advertise();
    }, [bleState, advertising]);

    const stopAdvertise = useCallback(() => {
        if (bleState !== 'PoweredOn' || !advertising) return;
        setAdvertising(false);
        manager.stopAdvertise();
    }, [bleState, advertising]);

    const getConnectedDevices = useCallback(async () => {
        await manager.requestPermissions();
        if (bleState !== 'PoweredOn') return;
        return await manager.getConnectedDevices();
    }, [bleState])

    const handleConnect = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();
        setConnected(device);
        await saveLastDevice(device.id);
        device.onDisconnected(() => {
            if (!reconnecting) {
            } setConnected(null);
            clearLastDevice();
        });
        if (disconnectSub) {
            disconnectSub.remove();
            setDisconnectSub(null);
        }
        await device.discoverAllServicesAndCharacteristics();
        setConnected(device);
        await saveLastDevice(device.id);

        const sub = device.onDisconnected(() => {
            sub.remove();
            setDisconnectSub(null);
            setConnected(null);
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
        if (!connected) return;
        try {
            await connected.cancelConnection();
        } catch { }
        setConnected(null);
        clearLastDevice();
    }, [connected]);

    return (
        <BleContext.Provider
            value={{ bleState, devices, connected, scanning, advertising, advertiseService, stopAdvertise, getConnectedDevices, scanForDevices: scanForDevices as any, connect, disconnect }}
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
