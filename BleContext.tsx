// BleContext.tsx
import React, {
    createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react';
import { manager, getLastDevice, saveLastDevice, clearLastDevice, SERVICE_UUID } from './ble.ts';
import type {Device, State, Subscription} from 'react-native-ble-plx';
import { reconnecting } from './ble.ts';

interface BleContextValue {
    bleState: State | null;
    devices: Device[];
    connected: Device | null;
    scanning: boolean;
    scanForDevices: () => void;
    connect: (device: Device) => void;
    disconnect: () => void;
}

const BleContext = createContext<BleContextValue | undefined>(undefined);

export function BleProvider({ children }: { children: ReactNode }) {
    const [bleState, setBleState] = useState<State | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [connected, setConnected] = useState<Device | null>(null);
    const [scanning, setScanning] = useState(false);
    const [disconnectSub, setDisconnectSub] = useState<Subscription | null>(null);

    // StateChange-Listener
    useEffect(() => {
        const sub = manager.onStateChange(async (state) => {
            setBleState(state);
            if (state === 'PoweredOn') {
                // Versuche Reconnect
                const lastId = await getLastDevice();
                if (lastId) {
                    try {
                        const dev = await manager.connectToDevice(lastId);
                        handleConnect(dev);
                    } catch { /* no-op */ }
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

    // Scan
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

    // Connect helper
    const handleConnect = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();
        setConnected(device);
        await saveLastDevice(device.id);
        device.onDisconnected(() => {
            if (!reconnecting) {
                //Alert.alert('Verbindung verloren', 'Die Uhr wurde getrennt.');
            }            setConnected(null);
            clearLastDevice();
        });
        if (disconnectSub) {
            disconnectSub.remove();
            setDisconnectSub(null);
        }
        await device.discoverAllServicesAndCharacteristics();
        setConnected(device);
        await saveLastDevice(device.id);

        // neuen onDisconnected listener anlegen – genau einer!
        const sub = device.onDisconnected(() => {
            // Listener direkt wieder entfernen, damit er nicht mehrfach feuert
            sub.remove();
            setDisconnectSub(null);

            //Alert.alert('Verbindung verloren', 'Die Uhr wurde getrennt.');
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
        } catch {}
        setConnected(null);
        clearLastDevice();
    }, [connected]);

    return (
        <BleContext.Provider
            value={{ bleState, devices, connected, scanning, scanForDevices: scanForDevices as any, connect, disconnect }}
        >
            {children}
        </BleContext.Provider>
    );
};

// Hook zum Konsumieren
export function useBle() {
    const ctx = useContext(BleContext);
    if (!ctx) throw new Error('useBle must be used inside BleProvider');
    return ctx;
}
