import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function Amrap() {
    const [amrapMin, setAmrapMin] = useState("1");
    const [amrapSec, setAmrapSec] = useState("0");
    const [countdown, setCountdown] = useState(10);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [time, setTime] = useState(0);
    const [reps, setReps] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

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

    const getDurationMs = () => {
        const min = parseInt(amrapMin) || 0;
        const sec = parseInt(amrapSec) || 0;
        return (min * 60 + sec) * 1000;
    };

    const start = () => {
        setCountdown(10);
        setDone(false);
        setReps(0);
        const prep = setInterval(() => {
            setCountdown(c => {
                if (c === 1) {
                    clearInterval(prep);
                    vibrate();
                    startTimer();
                }
                return c - 1;
            });
        }, 1000);
    };

    const startTimer = () => {
        setRunning(true);
        setTime(0);
        const duration = getDurationMs();
        startTimeRef.current = Date.now();
        vibrate();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            setTime(elapsed);

            if (elapsed >= duration) {
                clearInterval(intervalRef.current!);
                vibrate();
                setRunning(false);
                setDone(true);
            }
        }, 50);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setDone(false);
        setCountdown(10);
        setTime(0);
        setReps(0);
    };

    const formatTime = (ms: number) => {
        const remaining = getDurationMs() - ms;
        const totalSec = Math.max(0, Math.floor(remaining / 1000));
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>🌀 AMRAP</Text>

            {!running && !done ? (
                <>
                    <Text style={styles.label}>Dauer:</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <TextInput
                            value={amrapMin}
                            onChangeText={setAmrapMin}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Min"
                        />
                        <TextInput
                            value={amrapSec}
                            onChangeText={setAmrapSec}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Sek"
                        />
                    </View>
                    <Button title="Start" onPress={start} />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ Zeit abgelaufen!</Text>
                    <Text style={{ fontSize: 20 }}>Du hast {reps} Runden geschafft.</Text>
                    <Button title="Neu starten" onPress={reset} />
                </>
            ) : (
                <>
                    <Text style={styles.time}>{formatTime(time)}</Text>
                    <Text style={{ fontSize: 20, marginVertical: 10 }}>Runden: {reps}</Text>
                    <Button
                        title="✅ Runde abgeschlossen"
                        onPress={() => {
                            setReps(prev => prev + 1);
                            vibrate();
                        }}
                    />
                    <View style={{ marginTop: 20 }}>
                        <Button title="Abbrechen" onPress={reset} color="#bb2222" />
                    </View>
                </>
            )}

            {!running && countdown < 10 && countdown > 0 && (
                <>
                    <Text style={{ fontSize: 20, marginBottom: 10 }}>Vorbereitung …</Text>
                    <Text style={{ fontSize: 48 }}>{countdown}</Text>
                </>
            )}
        </View>
    );
}
