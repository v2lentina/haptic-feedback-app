import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Easing, Keyboard, Switch,
    Text, TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { vibrate } from '../ble';
import { styles } from '../styles';

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

export default function Beeptest ({ navigation }: { navigation: any }) {
    const [level, setLevel]       = useState(1);
    const [runState, setRunState] = useState(1);
    const [running, setRunning]   = useState(false);
    const [done, setDone]         = useState(false);
    const [timeLeft, setLeft]     = useState(0);

    const timeoutRef     = useRef<NodeJS.Timeout|null>(null);
    const clockRef       = useRef<NodeJS.Timeout|null>(null);
    const idxRef         = useRef(0);
    const runRef         = useRef(1);
    const runStartRef    = useRef<number>(0);

    const [prepEnabled, setPrepEnabled] = useState(true);
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);

    const stoppedRef = useRef(false);

    const bg = useRef(new Animated.Value(0)).current;
    const [circleKey, setCircleKey] = useState(0);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            stop();
        });
        return unsubscribe;
    }, [navigation]);

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

    const fmt = (ms: number) => {
        const totalSec = Math.ceil(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const start = () => {
        Keyboard.dismiss();
        stoppedRef.current = false;
        setStarted(true);

        if (prepEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next === 3 || next === 2 || next === 1) vibrate(VibrationPattern.BUZZ_SHORT);
                    if (next === 0) {
                        clearInterval(prep);
                        vibrate(VibrationPattern.BUZZ_LONG);
                        doStart();
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(VibrationPattern.BUZZ_LONG);
            doStart();
        }
    };

    const doStart = () => {
        idxRef.current = 0;
        runRef.current = 1;
        setLevel(1);
        setRunState(1);
        setDone(false);
        setRunning(true);
        nextRun();
    };

    const nextRun = () => {
        if (stoppedRef.current) return;

        const cur = levelData[idxRef.current];

        if (!(runRef.current === 1 && idxRef.current === 0)) {
            vibrate(VibrationPattern.BUZZ_NORMAL);
        }

        runStartRef.current = Date.now();
        setLeft(cur.pace);
        setCircleKey(k => k + 1);

        clearInterval(clockRef.current!);
        clockRef.current = setInterval(() => {
            if (stoppedRef.current) {
                clearInterval(clockRef.current!);
                return;
            }
            const left = Math.max(0, cur.pace - (Date.now() - runStartRef.current));
            setLeft(left);
        }, 50);

        clearTimeout(timeoutRef.current!);
        timeoutRef.current = setTimeout(() => {
            if (stoppedRef.current) return;

            if (runRef.current < cur.runs) {
                runRef.current += 1;
                setRunState(runRef.current);
                nextRun();
            } else {
                vibrate(VibrationPattern.BUZZ_NORMAL);
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
        stoppedRef.current = true;
        clearTimeout(timeoutRef.current!);
        clearInterval(clockRef.current!);
        setCircleKey(k => k + 1);
        setRunning(false);
        setDone(true);
    };

    const resetToStartScreen = () => {
        setDone(false);
        setStarted(false);
        setRunning(false);
        setRunState(1);
        setLevel(1);
    };

    const pace = running ? levelData[idxRef.current].pace : 1;
    const progress = running ? 1 - timeLeft / pace : 0;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                    {!started && (
                        <>
                            <Text style={[styles.h1, { marginBottom: 6 }]}>🏃 Beep-Test</Text>
                            <Text style={[styles.subLabel, { color: '#666', marginBottom: 20, textAlign: 'center' }]}>
                                20 m Shuttle-Run mit steigendem Tempo
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>10 s Vorbereitung</Text>
                                <Switch value={prepEnabled} onValueChange={setPrepEnabled} />
                            </View>

                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>

                            <Text style={[styles.subLabel, { color: '#666', marginTop: 24, fontSize: 13, textAlign: 'center' }]}>
                                Laufe 20 m hin- und her.{'\n'}
                                <Text style={{ fontWeight: '600' }}>Wende beim Beep.</Text>{'\n'}
                                Tempo steigt pro Level.
                            </Text>
                        </>
                    )}

                    {started && !running && !done && (
                        <>
                            <Animated.Text style={[styles.time, { color: textColor }]}>
                                {countdown}
                            </Animated.Text>
                            <Text style={[styles.subLabel]}>Vorbereitung</Text>
                        </>
                    )}

                    {done && (
                        <>
                            <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                ✅ Fertig!
                            </Animated.Text>
                            <Text style={[styles.subLabel]}>
                                Level {level} – Lauf {runState}
                            </Text>
                            <TouchableOpacity style={styles.startButton} onPress={resetToStartScreen}>
                                <Text style={styles.buttonText}>Neu starten</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {running && (
                        <>
                            <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                Level {level} – Lauf {runState} / {levelData[idxRef.current].runs}
                            </Text>

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
