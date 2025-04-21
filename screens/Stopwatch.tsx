import React, { useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';

export default function StopwatchScreen() {
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const start = () => {
        if (running) return;
        setRunning(true);
        startTimeRef.current = Date.now() - time;
        intervalRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
        }, 50);
    };

    const stop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
    };

    const reset = () => {
        stop();
        setTime(0);
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
            <Text style={styles.title}>⏱ Stoppuhr</Text>
            <Text style={styles.time}>{formatTime(time)}</Text>

            <View style={styles.buttonRow}>
                <Button
                    title={running ? "Stop" : "Start"}
                    onPress={running ? stop : start}
                />
                <View style={{ width: 15 }} />
                <Button title="Reset" onPress={reset} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
    time: {
        fontSize: 48,
        fontVariant: ["tabular-nums"],
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        letterSpacing: 2,
        marginBottom: 30,
    },
    buttonRow: { flexDirection: 'row' },
});
