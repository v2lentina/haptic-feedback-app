import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function DownRd() {
    const [roundCount, setRoundCount] = useState("5");
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [done, setDone] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const roundStartRef = useRef<number>(0);
    const roundMillisRef = useRef<number>(0);
    const currentRoundRef = useRef<number>(1);

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
                    beginRounds();
                }
                return c - 1;
            });
        }, 1000);
    };

    const beginRounds = () => {
        setRunning(true);

        const min = parseInt(roundMinutes) || 0;
        const sec = parseInt(roundSeconds) || 0;
        roundMillisRef.current = (min * 60 + sec) * 1000;

        currentRoundRef.current = 1;
        setCurrentRound(1);
        startNextRound();
    };

    const startNextRound = () => {
        roundStartRef.current = Date.now();
        setRemaining(roundMillisRef.current);

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - roundStartRef.current;
            const left = Math.max(roundMillisRef.current - elapsed, 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate();

                if (currentRoundRef.current < parseInt(roundCount)) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startNextRound();
                } else {
                    setRunning(false);
                    setDone(true);
                }
            }
        }, 50);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRemaining(0);
        setCountdown(10);
        setStarted(false);
        setRunning(false);
        setDone(false);
        currentRoundRef.current = 1;
        setCurrentRound(1);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.ceil(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        const hundredths = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${min}:${sec}.${hundredths}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>⏬ Runterzählen mit Runden</Text>

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
                    <Text style={styles.time}>{formatTime(remaining)}</Text>
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
