import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

const levelData = [
    { level: 1, runs: 7, pace: 9000 },
    { level: 2, runs: 8, pace: 8700 },
    { level: 3, runs: 8, pace: 8400 },
    { level: 4, runs: 9, pace: 8100 },
    { level: 5, runs: 9, pace: 7800 },
    { level: 6, runs: 10, pace: 7500 },
    { level: 7, runs: 10, pace: 7200 },
    { level: 8, runs: 11, pace: 6900 },
    { level: 9, runs: 11, pace: 6600 },
    { level: 10, runs: 12, pace: 6300 },
];

export default function Beeptest() {
    const [level, setLevel] = useState(1);
    const [run, setRun] = useState(1);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const runTimeout = useRef<NodeJS.Timeout | null>(null);
    const clockInterval = useRef<NodeJS.Timeout | null>(null);
    const currentLevelIndex = useRef(0);
    const currentRun = useRef(1);
    const runStartTime = useRef<number>(0);

    const vibrate = async (times = 1) => {
        const devices = await manager.connectedDevices([SERVICE_UUID]);
        if (!devices.length) return;
        const connected = devices[0];
        try {
            for (let i = 0; i < times; i++) {
                await manager.writeCharacteristicWithoutResponseForDevice(
                    connected.id,
                    SERVICE_UUID,
                    CHAR_UUID,
                    Buffer.from([1]).toString("base64")
                );
                if (i < times - 1) await new Promise(res => setTimeout(res, 300));
            }
        } catch (e) {
            console.error("❌ Vibrationsfehler:", e);
        }
    };

    const start = () => {
        setLevel(1);
        setRun(1);
        currentRun.current = 1;
        currentLevelIndex.current = 0;
        setDone(false);
        setRunning(true);
        nextRun();
    };

    const nextRun = () => {
        const current = levelData[currentLevelIndex.current];

        vibrate(1);
        runStartTime.current = Date.now();
        setTimeLeft(current.pace);

        // Laufuhr
        if (clockInterval.current) clearInterval(clockInterval.current);
        clockInterval.current = setInterval(() => {
            const remaining = current.pace - (Date.now() - runStartTime.current);
            setTimeLeft(Math.max(0, remaining));
        }, 100);

        runTimeout.current = setTimeout(() => {
            if (currentRun.current < current.runs) {
                currentRun.current++;
                setRun(currentRun.current);
                nextRun();
            } else {
                vibrate(2); // Levelwechsel
                currentLevelIndex.current++;
                if (currentLevelIndex.current >= levelData.length) {
                    stop();
                    return;
                }
                const next = levelData[currentLevelIndex.current];
                setLevel(next.level);
                currentRun.current = 1;
                setRun(1);
                nextRun();
            }
        }, current.pace);
    };

    const stop = () => {
        if (runTimeout.current) clearTimeout(runTimeout.current);
        if (clockInterval.current) clearInterval(clockInterval.current);
        setRunning(false);
        setDone(true);
    };

    const formatMs = (ms: number) => {
        const sec = Math.floor(ms / 1000).toString().padStart(2, '0');
        const msLeft = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${sec}.${msLeft}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>🏃 Beep Test</Text>

            {!running && !done ? (
                <>
                    <Text>20 m Shuttle Run, steigendem Tempo</Text>
                    <Button title="Start" onPress={start} />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ Beendet</Text>
                    <Text style={{ fontSize: 20 }}>Level {level} – Lauf {run}</Text>
                    <Button title="Neu starten" onPress={start} />
                </>
            ) : (
                <>
                    <Text style={{ fontSize: 20 }}>⏱ Zeit bis nächster Beep:</Text>
                    <Text style={styles.time}>{formatMs(timeLeft)}</Text>
                    <Text style={{ fontSize: 22, marginTop: 20 }}>Level {level}</Text>
                    <Text style={{ fontSize: 18 }}>Lauf {run} von {levelData[currentLevelIndex.current].runs}</Text>
                    <View style={{ marginTop: 30 }}>
                        <Button title="🛑 Stoppen" onPress={stop} color="#bb2222" />
                    </View>
                </>
            )}
        </View>
    );
}
