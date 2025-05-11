// Beeptest.tsx --------------------------------------------------------------
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    TouchableWithoutFeedback, Animated, Easing, Keyboard,
} from 'react-native';
import { Buffer } from 'buffer';
import { manager, SERVICE_UUID, CHAR_UUID } from '../ble';
import * as Progress from 'react-native-progress';
import { styles } from '../styles';

/* ------- Level-Tabelle (m/s → Pace in ms) ----------------------------- */
const levelData = [
    { level: 1,  runs: 7,  pace: 9000 },
    { level: 2,  runs: 8,  pace: 8700 },
    { level: 3,  runs: 8,  pace: 8400 },
    { level: 4,  runs: 9,  pace: 8100 },
    { level: 5,  runs: 9,  pace: 7800 },
    { level: 6,  runs: 10, pace: 7500 },
    { level: 7,  runs: 10, pace: 7200 },
    { level: 8,  runs: 11, pace: 6900 },
    { level: 9,  runs: 11, pace: 6600 },
    { level: 10, runs: 12, pace: 6300 },
];

export default function Beeptest() {
    /* ---------- State ---------- */
    const [level, setLevel]       = useState(1);
    const [runState, setRunState] = useState(1);           // UI-Run
    const [running, setRunning]   = useState(false);
    const [done, setDone]         = useState(false);
    const [timeLeft, setLeft]     = useState(0);           // ms

    /* ---------- Refs ----------- */
    const timeoutRef     = useRef<NodeJS.Timeout|null>(null);
    const clockRef       = useRef<NodeJS.Timeout|null>(null);
    const idxRef         = useRef(0);                      // Level-Index
    const runRef         = useRef(1);                      // aktueller Run
    const runStartRef    = useRef<number>(0);

    /* ---------- Hintergrund-Anim ---------- */
    const bg = useRef(new Animated.Value(0)).current;      // 0 idle · 1 running
    const [circleKey, setCircleKey] = useState(0);

    useEffect(() => {
        Animated.timing(bg, {
            toValue: running ? 1 : 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [running]);

    const backgroundColor = bg.interpolate({
        inputRange: [0, 1],
        outputRange: ['#f5f5f5', '#007AFF'],
    });
    const textColor = bg.interpolate({
        inputRange: [0, 1],
        outputRange: ['#000', '#fff'],
    });

    /* ---------- Vibrate ---------- */
    const vibrate = async (times = 1) => {
        const dev = await manager.connectedDevices([SERVICE_UUID]);
        if (!dev.length) return;
        try {
            for (let i = 0; i < times; i++) {
                await manager.writeCharacteristicWithoutResponseForDevice(
                    dev[0].id, SERVICE_UUID, CHAR_UUID, Buffer.from([1]).toString('base64'),
                );
                if (i < times - 1) await new Promise(r => setTimeout(r, 300));
            }
        } catch { /* silent */ }
    };

    /* ---------- Helper ---------- */
    const fmt = (ms: number) => {
        const s  = Math.floor(ms / 1000).toString().padStart(2, '0');
        const hs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${s}.${hs}`;
    };

    /* ---------- Steuer-Logik ---------- */
    const start = () => {
        Keyboard.dismiss();
        idxRef.current = 0;
        runRef.current = 1;
        setLevel(1);
        setRunState(1);
        setDone(false);
        setRunning(true);
        nextRun();
    };

    const nextRun = () => {
        const cur = levelData[idxRef.current];

        /* Start eines Runs */
        vibrate(1);
        runStartRef.current = Date.now();
        setLeft(cur.pace);
        setCircleKey(k => k + 1);           // Progress neu mounten

        /* Laufende Uhr */
        clearInterval(clockRef.current!);
        clockRef.current = setInterval(() => {
            const left = Math.max(0, cur.pace - (Date.now() - runStartRef.current));
            setLeft(left);
        }, 50);

        /* Timeout für Run-Ende */
        clearTimeout(timeoutRef.current!);
        timeoutRef.current = setTimeout(() => {
            if (runRef.current < cur.runs) {
                /* gleicher Level – nächster Run */
                runRef.current += 1;
                setRunState(runRef.current);
                nextRun();
            } else {
                /* Levelwechsel */
                vibrate(2);
                if (idxRef.current >= levelData.length - 1) {
                    stop();
                    return;
                }
                idxRef.current += 1;
                const nxt = levelData[idxRef.current];
                setLevel(nxt.level);
                runRef.current = 1;
                setRunState(1);
                nextRun();
            }
        }, cur.pace);
    };

    const stop = () => {
        clearTimeout(timeoutRef.current!);
        clearInterval(clockRef.current!);
        setCircleKey(k => k + 1);          // detach Progress → kein Anim-Crash
        setRunning(false);
        setDone(true);
    };

    /* ---------- Progress ---------- */
    const pace = running ? levelData[idxRef.current].pace : 1;
    const progress = running ? 1 - timeLeft / pace : 0;

    /* =========================== UI =========================== */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                    {/* -------------- Setup -------------- */}
                    {!running && !done && (
                        <>
                            <Text style={[styles.h1, { marginBottom: 6 }]}>🏃 Beep-Test</Text>
                            <Text style={[styles.subLabel, { color: '#666', marginBottom: 30, textAlign: 'center' }]}>
                                20 m Shuttle-Run mit steigendem Tempo
                            </Text>

                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>

                            <Text
                                style={[
                                    styles.subLabel,
                                    { color: '#666', marginTop: 24, fontSize: 13, textAlign: 'center' },
                                ]}>
                                Laufe 20 m hin- und her.{'\n'}
                                <Text style={{ fontWeight: '600' }}>Wende beim Beep.</Text>{'\n'}
                                Tempo steigt pro Level.
                            </Text>
                        </>
                    )}

                    {/* -------------- Ergebnis -------------- */}
                    {done && (
                        <>
                            <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                ✅ Beendet
                            </Animated.Text>
                            <Text style={[styles.subLabel]}>
                                Level {level} – Lauf {runState}
                            </Text>
                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Neu starten</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* -------------- Laufender Test -------------- */}
                    {running && (
                        <>
                            <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                Level {level} – Lauf {runState} / {levelData[idxRef.current].runs}
                            </Text>

                            {/* Progress-Ring nur im Laufbetrieb */}
                            <View style={styles.progressContainer}>
                                <Progress.Circle
                                    key={circleKey}
                                    size={250}
                                    progress={progress}
                                    color="#fff"
                                    borderWidth={4}
                                    thickness={8}
                                    unfilledColor="rgba(255,255,255,0.2)"
                                    animated
                                    direction="clockwise"
                                />
                                <View style={styles.timerOverlay}>
                                    <Animated.Text style={[styles.time, { color: textColor }]}>
                                        {fmt(timeLeft)}
                                    </Animated.Text>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.stopButton, { marginTop: 40 }]} onPress={stop}>
                                <Text style={styles.buttonText}>Stoppen</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
