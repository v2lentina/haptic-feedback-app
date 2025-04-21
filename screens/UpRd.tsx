import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function UpRd() {
    const [roundCount, setRoundCount] = useState("5");
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [done, setDone] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);

    const currentRoundRef = useRef(1);
    const [roundMinutes, setRoundMinutes] = useState("0");
    const [roundSeconds, setRoundSeconds] = useState("10");

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

    const start = () => {
        setStarted(true);
        setCountdown(10);
        const prep = setInterval(() => {
            setCountdown((c) => {
                if (c === 1) {
                    clearInterval(prep);
                    vibrate();
                    beginRoundTimer();
                }
                return c - 1;
            });
        }, 1000);
    };

    const beginRoundTimer = () => {
        setRunning(true);
        startTimeRef.current = Date.now();
        roundStartTimeRef.current = Date.now();

        const totalRounds = parseInt(roundCount);
        const min = parseInt(roundMinutes) || 0;
        const sec = parseInt(roundSeconds) || 0;
        const roundMillis = (min * 60 + sec) * 1000;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const currentRoundElapsed = now - roundStartTimeRef.current;

            setTime(currentRoundElapsed);

            if (currentRoundElapsed >= roundMillis) {
                if (currentRoundRef.current < totalRounds) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    roundStartTimeRef.current = Date.now();
                    setTime(0); // Timer zurücksetzen
                    vibrate();  // Neue Runde vibrieren
                } else {
                    clearInterval(intervalRef.current!);
                    vibrate(); // Finales Vibrationssignal
                    setRunning(false);
                    setDone(true);
                }
            }
        }, 50);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTime(0);
        setCountdown(10);
        setStarted(false);
        setRunning(false);
        setDone(false);
        currentRoundRef.current = 1;
        setCurrentRound(1);
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
            <Text style={styles.h1}>⏫ Hochzählen mit Runden</Text>

            {!started ? (
                <>
                    <Text style={styles.label}>Rundenlänge:</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                        <View style={{ alignItems: 'center', marginRight: 10 }}>
                            <Text style={styles.subLabel}>Minuten</Text>
                            <TextInput
                                value={roundMinutes}
                                onChangeText={setRoundMinutes}
                                keyboardType="numeric"
                                style={input}
                                placeholder="0"
                            />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.subLabel}>Sekunden</Text>
                            <TextInput
                                value={roundSeconds}
                                onChangeText={setRoundSeconds}
                                keyboardType="numeric"
                                style={input}
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <Text>Anzahl Runden:</Text>
                    <TextInput
                        value={roundCount}
                        onChangeText={setRoundCount}
                        keyboardType="numeric"
                        style={input}
                    />

                    <Button title="Start" onPress={start} />
                </>
            ) : running ? (
                <>
                    <Text style={styles.time}>{formatTime(time)}</Text>
                    <Text style={{ fontSize: 18 }}>
                        Runde {currentRound} von {roundCount}
                    </Text>
                    <Button title="Abbrechen" onPress={reset} color="#bb2222" />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ Alle Runden abgeschlossen!</Text>
                    <Button title="Neu starten" onPress={reset} />
                </>
            ) : (
                <>
                    <Text style={{ fontSize: 20, marginBottom: 10 }}>Vorbereitung …</Text>
                    <Text style={{ fontSize: 48 }}>{countdown}</Text>
                </>
            )}
        </View>
    );
}
