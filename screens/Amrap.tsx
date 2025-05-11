import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Switch,
    Animated,
    Easing,
    Keyboard,
} from 'react-native';
import { Buffer } from 'buffer';
import { manager, SERVICE_UUID, CHAR_UUID } from '../ble';
import * as Progress from 'react-native-progress';
import { styles, input } from '../styles';

export default function Amrap() {
    /* ---------- State & Refs ---------- */
    const [min, setMin]                   = useState('5');
    const [sec, setSec]                   = useState('0');
    const [prepEnabled, setPrepEnabled]   = useState(true);

    const [countdown, setCountdown]       = useState(10);
    const [started, setStarted]           = useState(false);
    const [running, setRunning]           = useState(false);
    const [paused, setPaused]             = useState(false);
    const [done, setDone]                 = useState(false);

    const [remaining, setRemaining]       = useState(0);
    const [reps, setReps]                 = useState(0);

    const intervalRef     = useRef<NodeJS.Timeout|null>(null);
    const startRef        = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0);
    const totalMsRef      = useRef<number>(0);

    /* ---------- Animation ---------- */
    const [circleKey, setCircleKey] = useState(0);
    const bg = useRef(new Animated.Value(0)).current;
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

    /* ---------- Helpers ---------- */
    const totalMs = () => (parseInt(min) || 0) * 60_000 + (parseInt(sec) || 0) * 1_000;

    const timeStr = (ms: number) => {
        const s = Math.ceil(ms / 1_000);
        return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60)
            .toString()
            .padStart(2, '0')}`;
    };

    const progress =
        started && totalMsRef.current > 0
            ? 1 - Math.min((remaining + savedElapsedRef.current) / totalMsRef.current, 1)
            : 0;

    const vibrate = async () => {
        const d = await manager.connectedDevices([SERVICE_UUID]);
        if (!d.length) return;
        manager
            .writeCharacteristicWithoutResponseForDevice(
                d[0].id,
                SERVICE_UUID,
                CHAR_UUID,
                Buffer.from([1]).toString('base64'),
            )
            .catch(() => {});
    };

    /* ---------- Core Logic ---------- */
    const runTimer = () => {
        totalMsRef.current = totalMs();
        setRemaining(totalMsRef.current);
        setCircleKey(k => k + 1);
        setRunning(true);
        startRef.current = Date.now();
        savedElapsedRef.current = 0;

        intervalRef.current = setInterval(() => {
            const left =
                totalMsRef.current - (Date.now() - startRef.current + savedElapsedRef.current);
            setRemaining(Math.max(0, left));

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate();
                setRunning(false);
                setDone(true);
            }
        }, 50);
    };

    const start = () => {
        Keyboard.dismiss();
        setStarted(true);
        setReps(0);
        vibrate();

        if (prepEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    if (c === 1) {
                        clearInterval(prep);
                        vibrate();
                        runTimer();
                    }
                    return c - 1;
                });
            }, 1_000);
        } else {
            runTimer();
        }
    };

    const pause = () => {
        clearInterval(intervalRef.current!);
        savedElapsedRef.current += Date.now() - startRef.current;
        setRunning(false);
        setPaused(true);
    };

    const resume = () => {
        setRunning(true);
        setPaused(false);
        startRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const left =
                totalMsRef.current - (Date.now() - startRef.current + savedElapsedRef.current);
            setRemaining(Math.max(0, left));
            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate();
                setRunning(false);
                setDone(true);
            }
        }, 50);
    };

    const reset = () => {
        clearInterval(intervalRef.current!);
        setStarted(false);
        setRunning(false);
        setPaused(false);
        setDone(false);
        setCountdown(10);
        setRemaining(0);
        savedElapsedRef.current = 0;
        setReps(0);
        setCircleKey(k => k + 1);
    };

    /* ---------- UI ---------- */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        <>
                            <Text style={[styles.h1, { marginBottom: 20 }]}>Amrap</Text>
                            <Text style={[styles.subLabel2, { color: '#666', marginBottom: 20 }]}>
                                As Many Rounds As Possible – so viele Runden wie möglich in der gewählten Zeit
                            </Text>
                            {/* ===== überarbeitetes Feld-Layout ===== */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Minuten</Text>
                                    <TextInput
                                        value={min}
                                        onChangeText={setMin}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>

                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Sekunden</Text>
                                    <TextInput
                                        value={sec}
                                        onChangeText={setSec}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>
                            </View>
                            {/* ====================================== */}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>
                                    10 s Vorbereitung
                                </Text>
                                <Switch value={prepEnabled} onValueChange={setPrepEnabled} />
                            </View>

                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {running || paused ? (
                                <>
                                    <View style={styles.progressContainer}>
                                        <Progress.Circle
                                            key={circleKey}
                                            size={250}
                                            progress={progress}
                                            color="#ffffff"
                                            borderWidth={4}
                                            thickness={8}
                                            unfilledColor="rgba(255,255,255,0.2)"
                                            animated
                                            direction="clockwise"
                                        />
                                        <View style={styles.timerOverlay}>
                                            <Animated.Text style={[styles.time, { color: textColor }]}>
                                                {timeStr(remaining)}
                                            </Animated.Text>
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: 22, color: '#fff', marginVertical: 14 }}>
                                        Runden: {reps}
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.startButton}
                                        onPress={() => {
                                            setReps(r => r + 1);
                                            vibrate();
                                        }}>
                                        <Text style={styles.buttonText}>✅ Runde abgeschlossen</Text>
                                    </TouchableOpacity>

                                    <View style={{ flexDirection: 'row', marginTop: 30, gap: 20 }}>
                                        <TouchableOpacity style={styles.stopButton} onPress={reset}>
                                            <Text style={styles.buttonText}>Abbrechen</Text>
                                        </TouchableOpacity>

                                        {running ? (
                                            <TouchableOpacity style={styles.pauseButton} onPress={pause}>
                                                <Text style={styles.buttonText}>Pause</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={styles.startButton} onPress={resume}>
                                                <Text style={styles.buttonText}>Weiter</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </>
                            ) : done ? (
                                <>
                                    <Animated.Text
                                        style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ Zeit abgelaufen!
                                    </Animated.Text>
                                    <Text style={{ fontSize: 20, color: '#fff', marginBottom: 30 }}>
                                        Du hast {reps} Runden geschafft.
                                    </Text>
                                    <TouchableOpacity style={styles.startButton} onPress={reset}>
                                        <Text style={styles.buttonText}>Neu starten</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Animated.Text style={[styles.time, { color: textColor }]}>
                                        {countdown}
                                    </Animated.Text>
                                    <Text style={styles.subLabel}>Vorbereitung</Text>
                                </>
                            )}
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
