import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, Button, FlatList, TouchableOpacity, ScrollView, StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

type DeviceInfo = {
    id: string;
    name: string | null;
};

global.Buffer = global.Buffer || Buffer;

const manager = new BleManager();

export default function HomeScreen({ navigation }: any) {
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [connected, setConnected] = useState<Device | null>(null);
    const [services, setServices] = useState<string[]>([]);
    const [scanning, setScanning] = useState(false);
    const [bleState, setBleState] = useState<State | null>(null);
    const [buzzing, setBuzzing] = useState(false);
    const [buzzInterval, setBuzzInterval] = useState<NodeJS.Timeout | null>(null);

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
                console.log("🔁 Bereits verbunden:", already[0].id);
                return handleConnectedDevice(already[0]);
            }

            const lastId = await AsyncStorage.getItem("lastDeviceId");
            if (lastId) await connectToDevice(lastId);
        } catch (e) {
            console.warn("Reconnect‑Fehler:", e);
        }
    }, []);

    const scanForDevices = () => {
        if (bleState !== "PoweredOn") return;
        setScanning(true);
        setDevices([]);
        console.log("🔍 Scanne nach Bangle‑Uhren …");

        manager.startDeviceScan([], { allowDuplicates: false }, (error, device) => {
            if (error || !device) return;

            if (device.serviceUUIDs?.includes(SERVICE_UUID)) {
                setDevices((prev) =>
                    prev.some((d) => d.id === device.id) ? prev : [...prev, { id: device.id, name: device.name }]
                );
            }
        });

        setTimeout(() => {
            manager.stopDeviceScan();
            setScanning(false);
            console.log("🛑 Scan beendet.");
        }, 6000);
    };

    const connectToDevice = async (id: string) => {
        try {
            const device = await manager.connectToDevice(id, { timeout: 8000 });
            await handleConnectedDevice(device);
        } catch (e) {
            console.error("❌ Verbinden fehlgeschlagen:", e);
        }
    };

    const handleConnectedDevice = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();
        await AsyncStorage.setItem("lastDeviceId", device.id);
        setConnected(device);

        const list = await manager.servicesForDevice(device.id);
        setServices(list.map((s) => s.uuid));

        const sub = device.onDisconnected(() => {
            console.log("⚡︎ Verbindung verloren:", device.id);
            cleanup();
            sub.remove();
        });
    };

    const cleanup = async () => {
        if (connected) {
            try {
                await connected.cancelConnection();
            } catch { }
        }
        if (buzzInterval) {
            clearInterval(buzzInterval);
            setBuzzInterval(null);
        }
        setBuzzing(false);
        setConnected(null);
        setServices([]);
        await AsyncStorage.removeItem("lastDeviceId");
    };

    const sendVibration = async () => {
        if (!connected) return;
        try {
            await manager.writeCharacteristicWithoutResponseForDevice(
                connected.id,
                SERVICE_UUID,
                CHAR_UUID,
                Buffer.from([1]).toString("base64")
            );
            console.log("✅ Buzz geschickt!");
        } catch (e) {
            console.error("❌ Schreibfehler:", e);
        }
    };

    const toggleAutoBuzz = () => {
        if (!connected) return;

        if (buzzing) {
            if (buzzInterval) clearInterval(buzzInterval);
            setBuzzInterval(null);
            setBuzzing(false);
            console.log("⏹️ Auto-Buzz gestoppt");
        } else {
            const interval = setInterval(() => {
                manager.writeCharacteristicWithoutResponseForDevice(
                    connected.id,
                    SERVICE_UUID,
                    CHAR_UUID,
                    Buffer.from([1]).toString("base64")
                ).then(() => {
                    console.log("🔁 Auto-Buzz!");
                }).catch((e) => {
                    console.error("❌ Auto-Buzz Fehler:", e);
                });
            }, 10000);

            setBuzzInterval(interval);
            setBuzzing(true);
            console.log("▶️ Auto-Buzz gestartet");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>🧭 Wähle deinen Modus</Text>
            <Button title="⏱ Stoppuhr" onPress={() => navigation.navigate("Stoppuhr")} />
            <Button title="⏫ Hochzählen" onPress={() => navigation.navigate("Hochzählen")} />
            <Button title="⏫ Hochzählen in Runden" onPress={() => navigation.navigate("Hochzählen in Runden")} />
            <Button title="⏬️ Herunterzählen" onPress={() => navigation.navigate("Herunterzählen")} />
            <Button title="⏬️ Herunterzählen in Runden" onPress={() => navigation.navigate("Herunterzählen in Runden")} />
            <Button title="Interval" onPress={() => navigation.navigate("Interval")} />
            <Button title="Tabata" onPress={() => navigation.navigate("Tabata")} />
            <Button title="F9Bad" onPress={() => navigation.navigate("F9Bad")} />
            <Button title="Amrap" onPress={() => navigation.navigate("Amrap")} />
            <Button title="Beeptest" onPress={() => navigation.navigate("Beeptest")} />
            <Button title="Custom" onPress={() => navigation.navigate("Custom")} />

            {connected ? (
                <>
                    <Text style={styles.connected}>
                        Verbunden mit {connected.name ?? "Bangle"} ({connected.id})
                    </Text>

                    <Button title="Buzz senden" onPress={sendVibration} />
                    <Button
                        title={buzzing ? "Auto-Buzz stoppen" : "Auto-Buzz starten"}
                        color={buzzing ? "#bb2222" : "#228B22"}
                        onPress={toggleAutoBuzz}
                    />

                    <Button title="Trennen" color="#bb2222" onPress={cleanup} />

                    <ScrollView style={{ marginTop: 15 }}>
                        {services.map((s) => (
                            <Text key={s} style={styles.service}>Service UUID: {s}</Text>
                        ))}
                    </ScrollView>
                </>
            ) : (
                <>
                    <Button
                        title={scanning ? "Suche läuft…" : "Nach Uhr suchen"}
                        onPress={scanForDevices}
                        disabled={scanning}
                    />

                    {devices.length ? (
                        <FlatList
                            style={{ marginTop: 20 }}
                            data={devices}
                            keyExtractor={(d) => d.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.deviceBtn}
                                    onPress={() => connectToDevice(item.id)}
                                >
                                    <Text style={styles.deviceTxt}>
                                        {item.name ?? "Bangle"} ({item.id})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        !scanning && <Text style={styles.hint}>Keine Bangle‑Uhr gefunden.</Text>
                    )}
                </>
            )}

            {bleState !== "PoweredOn" && (
                <Text style={styles.error}>
                    Bluetooth {bleState === "PoweredOff" ? "ist aus" : "nicht bereit"}.
                </Text>
            )}
        </View>
    );
}
