import React, { useState, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function F9Bad() {
    const totalRounds = 3;
    const workMinutes = 5;
    const restMinutes = 1;
    const [countdown, setCountdown] = useState(10);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [inRest, setInRest] = useState(false);
    const [time, setTime] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const roundRef = useRef(1);

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
        setCountdown(10);
        setDone(false);
        const prep = setInterval(() => {
            setCountdown(c => {
                if (c === 1) {
                    clearInterval(prep);
                    vibrate();
                    startCycle();
                }
                return c - 1;
            });
        }, 1000);
    };

    const startCycle = () => {
        setRunning(true);
        setInRest(false);
        roundRef.current = 1;
        setCurrentRound(1);
        handlePhase("work");
    };

    const handlePhase = (phase: "work" | "rest") => {
        const duration = (phase === "work" ? workMinutes : restMinutes) * 60 * 1000;
        startTimeRef.current = Date.now();
        setInRest(phase === "rest");
        setTime(0);
        vibrate();

        if (phase === "work") {
            for (let i = 1; i < workMinutes; i++) {
                setTimeout(() => {
                    vibrate();
                }, i * 60 * 1000);
            }
        }

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = duration - elapsed;
            setTime(Math.max(0, remaining));

            if (elapsed >= duration) {
                clearInterval(intervalRef.current!);

                if (phase === "work") {
                    if (roundRef.current >= totalRounds) {
                        vibrate();
                        setRunning(false);
                        setDone(true);
                    } else {
                        setTimeout(() => handlePhase("rest"), 10);
                    }
                } else {
                    roundRef.current += 1;
                    setCurrentRound(roundRef.current);
                    setTimeout(() => handlePhase("work"), 10);
                }
            }
        }, 50);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setDone(false);
        setCountdown(10);
        setTime(0);
        setCurrentRound(1);
        roundRef.current = 1;
        setInRest(false);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>🥊 Fight Gone Bad</Text>

            {!running && !done ? (
                <>
                    <Text>5 min Work – 1 min Pause</Text>
                    <Text>3 Runden</Text>
                    <Button title="Start" onPress={start} />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ Workout abgeschlossen!</Text>
                    <Button title="Neu starten" onPress={reset} />
                </>
            ) : (
                <>
                    <Text style={styles.time}>{formatTime(time)}</Text>
                    <Text style={{ fontSize: 18 }}>
                        Runde {currentRound} von {totalRounds} – {inRest ? "Pause" : "Work"}
                    </Text>
                    <Button title="Abbrechen" onPress={reset} color="#bb2222" />
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
