import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

type DeviceInfo = { id: string; name: string | null; };

global.Buffer = global.Buffer || Buffer;
const manager = new BleManager();

export default function HomeScreen({ navigation }: any) {
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [connected, setConnected] = useState<Device | null>(null);
    const [scanning, setScanning] = useState(false);
    const [bleState, setBleState] = useState<State | null>(null);
    const [buzzing, setBuzzing] = useState(false);
    const [buzzInterval, setBuzzInterval] = useState<NodeJS.Timeout | null>(null);
    const [scanCompleted, setScanCompleted] = useState(false);

    useEffect(() => {
        const sub = manager.onStateChange((state) => {
            setBleState(state);
            if (state === "PoweredOn") reconnectLastKnown();
        }, true);
        return () => sub.remove();
    }, []);

    const reconnectLastKnown = useCallback(async () => {
        try {
            const already = await manager.connectedDevices([SERVICE_UUID]);
            if (already.length) {
                return handleConnectedDevice(already[0]);
            }
            const lastId = await AsyncStorage.getItem("lastDeviceId");
            if (lastId) await connectToDevice(lastId);
        } catch (e) {
            console.warn("Reconnect-Fehler:", e);
        }
    }, []);

    const scanForDevices = () => {
        if (bleState !== "PoweredOn") return;
        setScanCompleted(false);
        setScanning(true);
        setDevices([]);
        manager.startDeviceScan([], { allowDuplicates: false }, (error, device) => {
            if (error || !device) return;
            if (device.serviceUUIDs?.includes(SERVICE_UUID)) {
                setDevices((prev) => prev.some((d) => d.id === device.id) ? prev : [...prev, { id: device.id, name: device.name }]);
            }
        });
        setTimeout(() => {
            manager.stopDeviceScan();
            setScanning(false);
            setScanCompleted(true);
        }, 6000);
    };

    const connectToDevice = async (id: string) => {
        try {
            const device = await manager.connectToDevice(id, { timeout: 8000 });
            await handleConnectedDevice(device);
        } catch (e) {
            console.error("Verbindungsfehler:", e);
        }
    };

    const handleConnectedDevice = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();
        await AsyncStorage.setItem("lastDeviceId", device.id);
        setConnected(device);
        const sub = device.onDisconnected(() => {
            cleanup();
            Alert.alert("Verbindung verloren", "Die Verbindung zur Uhr wurde unterbrochen.");
            sub.remove();
        });
    };

    const cleanup = async () => {
        if (connected) {
            try { await connected.cancelConnection(); } catch {}
        }
        if (buzzInterval) {
            clearInterval(buzzInterval);
            setBuzzInterval(null);
        }
        setBuzzing(false);
        setConnected(null);
        setDevices([]);
        await AsyncStorage.removeItem("lastDeviceId");
    };

    const connectionStatus = connected
        ? { color: '#34C759', text: `Verbunden mit ${connected.name ?? "Gerät"}` }
        : scanning
            ? { color: '#007AFF', text: 'Scannen...' }
            : { color: '#8e8e93', text: 'Nicht verbunden' };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.connectionStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
                    <Text style={styles.statusLabel}>{connectionStatus.text}</Text>
                </View>

                {!connected && (
                    <>
                        {!scanning && (
                            <TouchableOpacity style={styles.scanButton} onPress={scanForDevices}>
                                <Text style={styles.scanButtonText}>Nach Gerät scannen</Text>
                            </TouchableOpacity>
                        )}
                        {scanning && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />}

                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.deviceCard}
                                    onPress={() => connectToDevice(item.id)}
                                >
                                    <Text style={styles.deviceName}>{item.name ?? "Unbekanntes Gerät"}</Text>
                                    <Text style={styles.deviceHint}>Zum Verbinden tippen</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                (!scanning && scanCompleted && devices.length === 0) ? (
                                    <Text style={styles.hint}>Keine Geräte gefunden.</Text>
                                ) : null
                            }
                            scrollEnabled={false}
                            style={{ width: "100%", marginTop: 10 }}
                        />
                    </>
                )}

                {connected && (
                    <View style={styles.connectedActions}>
                        <TouchableOpacity
                            style={styles.scanButtonEx}
                            onPress={() => {
                                Alert.alert(
                                    "Verbindung trennen",
                                    "Möchtest du die Verbindung wirklich trennen?",
                                    [
                                        { text: "Abbrechen", style: "cancel" },
                                        { text: "Trennen", style: "destructive", onPress: cleanup }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.scanButtonText}>Verbindung trennen</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {bleState !== "PoweredOn" && (
                    <Text style={styles.error}>
                        Bluetooth {bleState === "PoweredOff" ? "ist aus" : "nicht bereit"}.
                    </Text>
                )}

                <Text style={[styles.h1, { marginTop: 40 }]}>Wähle deinen Modus</Text>

                <View style={styles.grid}>
                    {[
                        ["⏱ Stoppuhr", "⏫ Hochzählen"],
                        ["🔁 Hoch in Runden", "⏬ Runterzählen"],
                        ["🔂 Runter in Runden", "🔄 Interval"],
                        ["🧨 Tabata", "🥊 F9Bad"],
                        ["🔥 Amrap", "⏰ Emom"],
                        ["🐝 Beeptest", "🎛️ Custom"]
                    ].map((row, rowIndex) => (
                        <View style={styles.row} key={rowIndex}>
                            {row.map((label) => (
                                <TouchableOpacity
                                    key={label}
                                    style={styles.gridBtn}
                                    onPress={() => navigation.navigate(label)}
                                >
                                    <Text style={styles.gridBtnText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
