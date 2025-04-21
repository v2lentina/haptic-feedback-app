import React, { useRef, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function Up() {
    const [countdown, setCountdown] = useState(10);
    const [time, setTime] = useState(0);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const [durationMin, setDurationMin] = useState("0");
    const [durationSec, setDurationSec] = useState("10");

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

    const startTimer = () => {
        setStarted(true);
        setCountdown(10);
        const prepInterval = setInterval(() => {
            setCountdown((c) => {
                if (c === 1) {
                    clearInterval(prepInterval);
                    vibrate();
                    beginCountUp();
                }
                return c - 1;
            });
        }, 1000);
    };

    const beginCountUp = () => {
        setRunning(true);
        startTimeRef.current = Date.now();
        const min = parseInt(durationMin) || 0;
        const sec = parseInt(durationSec) || 0;
        const totalMillis = (min * 60 + sec) * 1000;

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            setTime(elapsed);

            if (elapsed >= totalMillis) {
                clearInterval(intervalRef.current!);
                vibrate();
                setRunning(false);
                setDone(true);
            }
        }, 50);
    };

    const reset = () => {
        setStarted(false);
        setRunning(false);
        setTime(0);
        setCountdown(10);
        setDone(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        const hundredths = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${min}:${sec}.${hundredths}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>⏫ Hochzählen mit Zielzeit</Text>

            {!started ? (
                <>
                    <Text style={styles.label}>Zielzeit:</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                        <View style={{ alignItems: 'center', marginRight: 10 }}>
                            <Text style={styles.subLabel}>Minuten</Text>
                            <TextInput
                                value={durationMin}
                                onChangeText={setDurationMin}
                                keyboardType="numeric"
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    padding: 10,
                                    width: 80,
                                    textAlign: 'center',
                                }}
                                placeholder="0"
                            />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.subLabel}>Sekunden</Text>
                            <TextInput
                                value={durationSec}
                                onChangeText={setDurationSec}
                                keyboardType="numeric"
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    padding: 10,
                                    width: 80,
                                    textAlign: 'center',
                                }}
                                placeholder="0"
                            />
                        </View>
                    </View>
                    <Button title="Start" onPress={startTimer} />
                </>
            ) : (
                <>
                    {running ? (
                        <>
                            <Text style={styles.time}>{formatTime(time)}</Text>
                            <Button title="Abbrechen" onPress={reset} color="#bb2222" />
                        </>
                    ) : done ? (
                        <>
                            <Text style={{ fontSize: 20, marginVertical: 20 }}>✅ Fertig!</Text>
                            <Button title="Neu starten" onPress={reset} />
                        </>
                    ) : (
                        <>
                            <Text style={{ fontSize: 20, marginBottom: 10 }}>Vorbereitung …</Text>
                            <Text style={{ fontSize: 48 }}>{countdown}</Text>
                        </>
                    )}
                </>
            )}

        </View>
    );
}
