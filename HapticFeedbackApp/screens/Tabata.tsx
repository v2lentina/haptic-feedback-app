import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    Switch,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import * as Progress from 'react-native-progress';
import { getLastDevice, softReconnect, vibrate } from '../ble';
import { styles } from '../styles';
import VibrationPatterns from '../vibrationPatterns';

/* ------------ Fixe Tabata-Parameter -------------------------------- */
const TOTAL_ROUNDS = 8;
const WORK_MS      = 20_000;   // 20 s
const REST_MS      = 10_000;   // 10 s

export default function Tabata({ navigation }: { navigation: any }) {
    const [preparationEnabled, setPreparationEnabled] = useState(true);
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [done, setDone] = useState(false);
    const [inRest, setInRest] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);

    const intervalRef = useRef<number | null>(null);
    const phaseStartRef = useRef<number>(0);
    const currentRoundRef = useRef<number>(1);
    const currentPhaseMS = useRef(WORK_MS);

    const phaseAnim = useRef(new Animated.Value(0)).current;
    const [circleKey, setCircleKey] = useState(0);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            reset();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const val = running ? (inRest ? 2 : 1) : 0;
        Animated.timing(phaseAnim, {
            toValue: val,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [running, inRest]);

    const backgroundColor = phaseAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['#f5f5f5', '#007AFF', '#FF9500'],
    });
    const textColor = phaseAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['#000', '#fff', '#fff'],
    });

    const formatTime = (ms: number) => {
        const totalSec = Math.ceil(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const progress =
        started && currentPhaseMS.current > 0
            ? 1 - Math.min(remaining / currentPhaseMS.current, 1)
            : 0;

    const start = async () => {
        Keyboard.dismiss();
        setStarted(true);

        if (preparationEnabled) {
            const lastId = await getLastDevice();
            if (lastId) softReconnect(lastId);
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next > 0 && next <= 3) vibrate(VibrationPatterns.BUZZ_SHORT);
                    if (next === 0) {
                        clearInterval(prep);
                        vibrate(VibrationPatterns.BUZZ_LONG);
                        beginTabata();
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(VibrationPatterns.BUZZ_LONG);
            beginTabata();
        }
    };

    const beginTabata = () => {
        setRunning(true);
        setPaused(false);
        setDone(false);
        currentRoundRef.current = 1;
        setCurrentRound(1);
        startPhase('work');
    };

    const startPhase = (phase: 'work' | 'rest') => {
        setCircleKey(k => k + 1);
        currentPhaseMS.current = phase === 'work' ? WORK_MS : REST_MS;
        phaseStartRef.current = Date.now();
        setRemaining(currentPhaseMS.current);
        setInRest(phase === 'rest');
        setPaused(false);
        vibrate(phase === 'work' ? VibrationPatterns.BUZZ_NORMAL : VibrationPatterns.BUZZ_NORMAL);

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - phaseStartRef.current;
            const left = Math.max(currentPhaseMS.current - elapsed, 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);

                if (phase === 'work') {
                    if (currentRoundRef.current >= TOTAL_ROUNDS) {
                        vibrate(VibrationPatterns.BUZZ_LONG);
                        setRunning(false);
                        setDone(true);
                    } else {
                        startPhase('rest');
                    }
                } else {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startPhase('work');
                }
            }
        }, 50);
    };

    const pause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPaused(true);
        setRunning(false);
    };

    const resume = () => {
        setRunning(true);
        setPaused(false);
        phaseStartRef.current = Date.now() - (currentPhaseMS.current - remaining);

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - phaseStartRef.current;
            const left = Math.max(currentPhaseMS.current - elapsed, 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);

                if (inRest) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startPhase('work');
                } else {
                    if (currentRoundRef.current >= TOTAL_ROUNDS) {
                        vibrate(VibrationPatterns.BUZZ_LONG);
                        setRunning(false);
                        setDone(true);
                    } else {
                        startPhase('rest');
                    }
                }
            }
        }, 50);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStarted(false);
        setRunning(false);
        setPaused(false);
        setDone(false);
        setCountdown(10);
        setRemaining(0);
        setInRest(false);
        currentRoundRef.current = 1;
        setCurrentRound(1);
        setCircleKey(k => k + 1);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        <>
                            <Text style={[styles.h1, { marginBottom: 14 }]}>Tabata</Text>
                            <Text style={[styles.subLabel, { color: '#666', marginBottom: 24 }]}>
                                20 s Work · 10 s Rest · 8 Runden
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>
                                    10s Vorbereitung
                                </Text>
                                <Switch value={preparationEnabled} onValueChange={setPreparationEnabled} />
                            </View>
                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>
                        </>
                    ) : done ? (
                        <>
                            <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                ✅ Fertig!
                            </Animated.Text>
                            <TouchableOpacity style={styles.startButton} onPress={reset}>
                                <Text style={styles.buttonText}>Neu starten</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {running || paused ? (
                                <>
                                    <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                        Runde {currentRound} von {TOTAL_ROUNDS} – {inRest ? 'Pause' : 'Work'}
                                    </Text>
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
                                                {formatTime(remaining)}
                                            </Animated.Text>
                                        </View>
                                    </View>
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
