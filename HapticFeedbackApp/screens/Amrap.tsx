import { default as React, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useBle } from '../BleContext';
import { input, styles } from '../styles';
import VibrationPatterns from '../vibrationPatterns';

export default function Amrap({ navigation }: { navigation: any }) {
    const [min, setMin] = useState('1');
    const [sec, setSec] = useState('0');
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [done, setDone] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [reps, setReps] = useState(0);

    const intervalRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0);
    const totalMsRef = useRef<number>(0);

    const [circleKey, setCircleKey] = useState(0);
    const bg = useRef(new Animated.Value(0)).current;

    const { vibrate } = useBle();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            reset();
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

    const totalMs = () =>
        (parseInt(min) || 0) * 60_000 + (parseInt(sec) || 0) * 1_000;

    const timeStr = (ms: number) => {
        const s = Math.ceil(ms / 1000);
        return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    };

    const progress = totalMsRef.current > 0
        ? 1 - Math.min(remaining / totalMsRef.current, 1)
        : 0;

    const runTimer = () => {
        totalMsRef.current = totalMs();
        setRemaining(totalMsRef.current);
        setCircleKey(k => k + 1);
        setRunning(true);
        startRef.current = Date.now();
        savedElapsedRef.current = 0;

        intervalRef.current = setInterval(() => {
            const left = totalMsRef.current - (Date.now() - startRef.current + savedElapsedRef.current);
            setRemaining(Math.max(0, left));

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate(VibrationPatterns.BUZZ_LONG);
                setRunning(false);
                setDone(true);
            }
        }, 50);
    };

    const start = async () => {
        Keyboard.dismiss();
        setStarted(true);
        setReps(0);

        if (prepEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next > 0 && next <= 3) vibrate(VibrationPatterns.BUZZ_SHORT);
                    if (next === 0) {
                        clearInterval(prep);
                        vibrate(VibrationPatterns.BUZZ_LONG);
                        runTimer();
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(VibrationPatterns.BUZZ_LONG);
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
            const left = totalMsRef.current - (Date.now() - startRef.current + savedElapsedRef.current);
            setRemaining(Math.max(0, left));
            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate(VibrationPatterns.BUZZ_LONG);
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
                    ) : running || paused ? (
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
                            <Animated.Text style={{ fontSize: 22, color: textColor, marginVertical: 14 }}>
                                Runden: {reps}
                            </Animated.Text>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => {
                                    setReps(r => r + 1);
                                    vibrate(VibrationPatterns.BUZZ_NORMAL);
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
                            <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                ✅ Fertig!
                            </Animated.Text>
                            <Animated.Text style={{ fontSize: 20, color: textColor, marginBottom: 30 }}>
                                Du hast {reps} Runden geschafft.
                            </Animated.Text>
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
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
