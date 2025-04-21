import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, Switch } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function Interval() {
    const [workMin, setWorkMin] = useState("0");
    const [workSec, setWorkSec] = useState("5");
    const [restMin, setRestMin] = useState("0");
    const [restSec, setRestSec] = useState("3");
    const [rounds, setRounds] = useState("3");
    const [countdown, setCountdown] = useState(10);
    const [running, setRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [inRest, setInRest] = useState(false);
    const [done, setDone] = useState(false);
    const [countDownMode, setCountDownMode] = useState(false); // false = hochzählen

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const [currentRound, setCurrentRound] = useState(1);
    const roundRef = useRef(1); // <- NEU!
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
                    startIntervalCycle();
                }
                return c - 1;
            });
        }, 1000);
    };

    const startIntervalCycle = () => {
        setRunning(true);
        setInRest(false);
        setCurrentRound(1);
        handlePhase("work");
    };

    const handlePhase = (phase: "work" | "rest") => {
        const isWork = phase === "work";
        const min = isWork ? parseInt(workMin) || 0 : parseInt(restMin) || 0;
        const sec = isWork ? parseInt(workSec) || 0 : parseInt(restSec) || 0;
        const duration = (min * 60 + sec) * 1000;
        const totalRounds = parseInt(rounds);

        startTimeRef.current = Date.now();
        setInRest(!isWork);
        if (!countDownMode) setTime(0);
        vibrate();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = duration - elapsed;
            setTime(countDownMode ? remaining : elapsed);

            if (elapsed >= duration) {
                clearInterval(intervalRef.current!);

                if (isWork) {
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
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        const hundredths = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${min}:${sec}.${hundredths}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>⏱ Intervalltraining</Text>

            {!running && !done ? (
                <>
                    <Text style={styles.label}>Arbeitszeit:</Text>
                    <View style={{ flexDirection: "row", marginBottom: 10 }}>
                        <TextInput
                            value={workMin}
                            onChangeText={setWorkMin}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Min"
                        />
                        <TextInput
                            value={workSec}
                            onChangeText={setWorkSec}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Sec"
                        />
                    </View>

                    <Text style={styles.label}>Pausenzeit:</Text>
                    <View style={{ flexDirection: "row", marginBottom: 10 }}>
                        <TextInput
                            value={restMin}
                            onChangeText={setRestMin}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Min"
                        />
                        <TextInput
                            value={restSec}
                            onChangeText={setRestSec}
                            keyboardType="numeric"
                            style={input}
                            placeholder="Sec"
                        />
                    </View>

                    <Text style={styles.label}>Anzahl Runden:</Text>
                    <TextInput
                        value={rounds}
                        onChangeText={setRounds}
                        keyboardType="numeric"
                        style={input}
                        placeholder="3"
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Text>Zählrichtung: </Text>
                        <Text>{countDownMode ? "⬇️ runter" : "⬆️ hoch"}</Text>
                        <Switch value={countDownMode} onValueChange={setCountDownMode} />
                    </View>

                    <Button title="Start" onPress={start} />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ Training abgeschlossen!</Text>
                    <Button title="Neu starten" onPress={reset} />
                </>
            ) : (
                <>
                    <Text style={styles.time}>{formatTime(time)}</Text>
                    <Text style={{ fontSize: 18 }}>
                        Runde {currentRound} von {rounds} – {inRest ? "Pause" : "Work"}
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
