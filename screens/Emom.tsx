import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { input, styles } from '../styles';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function Emom() {
    const [rounds, setRounds] = useState("10");
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    const [elapsed, setElapsed] = useState(0); // innerhalb der Minute

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const minuteRef = useRef<NodeJS.Timeout | null>(null);
    const roundRef = useRef(1);
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

    const start = () => {
        const total = parseInt(rounds);
        if (isNaN(total) || total <= 0) return;

        setRunning(true);
        setDone(false);
        setCurrentRound(1);
        roundRef.current = 1;
        startTimeRef.current = Date.now();
        vibrate();
        tickWithinMinute();

        intervalRef.current = setInterval(() => {
            roundRef.current += 1;
            if (roundRef.current > total) {
                clearInterval(intervalRef.current!);
                clearInterval(minuteRef.current!);
                setRunning(false);
                setDone(true);
                return;
            }
            setCurrentRound(roundRef.current);
            startTimeRef.current = Date.now();
            vibrate();
        }, 60000);
    };

    const tickWithinMinute = () => {
        minuteRef.current = setInterval(() => {
            const ms = Date.now() - startTimeRef.current;
            setElapsed(ms);
        }, 200);
    };

    const stop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (minuteRef.current) clearInterval(minuteRef.current);
        setRunning(false);
        setDone(true);
    };

    const formatTime = (ms: number) => {
        const sec = Math.floor(ms / 1000);
        const s = (sec % 60).toString().padStart(2, '0');
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.h1}>⏱ EMOM</Text>

            {!running && !done ? (
                <>
                    <Text style={styles.label}>Anzahl Minuten (Runden):</Text>
                    <TextInput
                        value={rounds}
                        onChangeText={setRounds}
                        keyboardType="numeric"
                        style={input}
                        placeholder="10"
                    />
                    <Button title="Start" onPress={start} />
                </>
            ) : done ? (
                <>
                    <Text style={{ fontSize: 24, marginVertical: 20 }}>✅ EMOM abgeschlossen!</Text>
                    <Button title="Neu starten" onPress={() => setDone(false)} />
                </>
            ) : (
                <>
                    <Text style={{ fontSize: 22 }}>Runde {currentRound} von {rounds}</Text>
                    <Text style={styles.time}>{formatTime(elapsed)}</Text>
                    <View style={{ marginTop: 30 }}>
                        <Button title="Abbrechen" onPress={stop} color="#bb2222" />
                    </View>
                </>
            )}
        </View>
    );
}
