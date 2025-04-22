import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

type Phase = {
    label: string;
    duration: number; // in seconds
};

export default function Custom() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [label, setLabel] = useState("");
    const [duration, setDuration] = useState("");
    const [running, setRunning] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const vibrate = async () => {
        const devices = await manager.connectedDevices([SERVICE_UUID]);
        if (!devices.length) return;
        const connected = devices[0];
        try {
            await manager.writeCharacteristicWithoutResponseForDevice(
                connected.id,
                SERVICE_UUID,
                CHAR_UUID,
                Buffer.from([1]).toString("base64")
            );
        } catch (e) {
            console.error("❌ Vibrationsfehler:", e);
        }
    };

    const addPhase = () => {
        const sec = parseInt(duration);
        if (!label || isNaN(sec) || sec <= 0) return;
        setPhases([...phases, { label, duration: sec }]);
        setLabel("");
        setDuration("");
    };

    const start = () => {
        if (phases.length === 0) return;
        setRunning(true);
        setCurrentIndex(0);
        runPhase(0);
    };

    const runPhase = (index: number) => {
        if (index >= phases.length) {
            setRunning(false);
            return;
        }

        const current = phases[index];
        vibrate();
        setTimeLeft(current.duration);
        setCurrentIndex(index);

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    runPhase(index + 1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setCurrentIndex(0);
        setTimeLeft(0);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>🔧 Custom Mode</Text>

            {!running ? (
                <>
                    <View style={{ flexDirection: "row", marginBottom: 10 }}>
                        <TextInput
                            value={label}
                            onChangeText={setLabel}
                            placeholder="Name"
                            style={[input, { flex: 2 }]}
                        />
                        <TextInput
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            placeholder="Sek"
                            style={[input, { flex: 1, marginLeft: 5 }]}
                        />
                    </View>
                    <Button title="➕ Phase hinzufügen" onPress={addPhase} />

                    <FlatList
                        data={phases}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item, index }) => (
                            <Text>
                                {index + 1}. {item.label} – {item.duration}s
                            </Text>
                        )}
                        style={{ marginVertical: 20 }}
                    />

                    <Button title="▶️ Start" onPress={start} disabled={phases.length === 0} />
                </>
            ) : (
                <>
                    <Text style={{ fontSize: 24, marginBottom: 10 }}>
                        {phases[currentIndex]?.label}
                    </Text>
                    <Text style={styles.time}>
                        {timeLeft}s
                    </Text>
                    <View style={{ marginTop: 30 }}>
                        <Button title="⏹️ Stoppen" onPress={reset} color="#bb2222" />
                    </View>
                </>
            )}
        </View>
    );
}
