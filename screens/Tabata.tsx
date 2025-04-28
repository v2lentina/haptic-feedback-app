import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Switch,
    Keyboard,
    Animated,
    Easing,
} from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import * as Progress from 'react-native-progress';
import { styles, input } from '../styles';

/* ------------ BLE Konstanten --------------------------------------- */
const SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const CHAR_UUID    = '19b10002-e8f2-537e-4f6c-d104768a1214';
const manager      = new BleManager();

/* ------------ Fixe Tabata-Parameter -------------------------------- */
const TOTAL_ROUNDS = 8;
const WORK_MS      = 20_000;   // 20 s
const REST_MS      = 10_000;   // 10 s

export default function Tabata() {
    /* ----------------------------------------------------------------- */
    /*                            State                                  */
    /* ----------------------------------------------------------------- */
    const [preparationEnabled, setPreparationEnabled] = useState(true);

    const [countdown, setCountdown]   = useState(10);
    const [started, setStarted]       = useState(false);
    const [running, setRunning]       = useState(false);
    const [paused, setPaused]         = useState(false);
    const [done, setDone]             = useState(false);

    const [inRest, setInRest]         = useState(false);
    const [remaining, setRemaining]   = useState(0);
    const [currentRound, setCurrentRound] = useState(1);

    /* ----------------------------------------------------------------- */
    /*                            Refs                                   */
    /* ----------------------------------------------------------------- */
    const intervalRef      = useRef<NodeJS.Timeout | null>(null);
    const phaseStartRef    = useRef<number>(0);
    const currentRoundRef  = useRef<number>(1);
    const currentPhaseMS   = useRef(WORK_MS);

    /* ----------------------------------------------------------------- */
    /*                    Animierter Hintergrund                         */
    /* ----------------------------------------------------------------- */
    // 0 = idle, 1 = work, 2 = rest
    const phaseAnim = useRef(new Animated.Value(0)).current;

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

    /* Progress-Circle Key zum Remounten (verhindert 1 → 0 Anim-Sprung) */
    const [circleKey, setCircleKey] = useState(0);

    /* ----------------------------------------------------------------- */
    /*                       Hilfs­funktionen                            */
    /* ----------------------------------------------------------------- */
    const vibrate = async () => {
        const devices = await manager.connectedDevices([SERVICE_UUID]);
        if (!devices.length) return;
        try {
            await manager.writeCharacteristicWithoutResponseForDevice(
                devices[0].id,
                SERVICE_UUID,
                CHAR_UUID,
                Buffer.from([1]).toString('base64'),
            );
        } catch (e) {
            console.error('❌ Vibrationsfehler:', e);
        }
    };

    const formatTime = (ms: number) => {
        const totalSec   = Math.ceil(ms / 1_000);
        const sec        = totalSec.toString().padStart(2, '0');
        return `${sec}`;
    };

    const progress =
        started && currentPhaseMS.current > 0
            ? 1 - Math.min(remaining / currentPhaseMS.current, 1)
            : 0;

    /* ----------------------------------------------------------------- */
    /*                         Timer-Logik                               */
    /* ----------------------------------------------------------------- */
    const start = () => {
        Keyboard.dismiss();
        setStarted(true);
        vibrate();

        if (preparationEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    if (c === 1) {
                        clearInterval(prep);
                        vibrate();
                        beginTabata();
                    }
                    return c - 1;
                });
            }, 1_000);
        } else {
            beginTabata();
        }
    };

    const beginTabata = () => {
        setRunning(true);
        currentRoundRef.current = 1;
        setCurrentRound(1);
        startPhase('work');
    };

    const startPhase = (phase: 'work' | 'rest') => {
        setCircleKey(k => k + 1);           // neuer Progress-Ring
        currentPhaseMS.current = phase === 'work' ? WORK_MS : REST_MS;
        phaseStartRef.current  = Date.now();
        setRemaining(currentPhaseMS.current);
        setInRest(phase === 'rest');
        setPaused(false);
        vibrate();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - phaseStartRef.current;
            const left    = Math.max(currentPhaseMS.current - elapsed, 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);

                if (phase === 'work') {
                    if (currentRoundRef.current >= TOTAL_ROUNDS) {
                        vibrate();
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
            const left    = Math.max(currentPhaseMS.current - elapsed, 0);
            setRemaining(left);
            if (left <= 0) {
                clearInterval(intervalRef.current!);
                // gleiche Logik wie oben
                if (inRest) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startPhase('work');
                } else {
                    if (currentRoundRef.current >= TOTAL_ROUNDS) {
                        vibrate();
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

    /* ----------------------------------------------------------------- */
    /*                              UI                                   */
    /* ----------------------------------------------------------------- */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        /* --------------------- Setup ------------------------- */
                        <>
                            <Text style={[styles.h1, { marginBottom: 14 }]}>🧨 Tabata</Text>
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
                    ) : (
                        /* ---------------- Running / Paused / Done ------------ */
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
                            ) : done ? (
                                /* ---------------- Finished ------------------------ */
                                <>
                                    <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ Fertig!
                                    </Animated.Text>
                                    <TouchableOpacity style={styles.startButton} onPress={reset}>
                                        <Text style={styles.buttonText}>Neu starten</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* ---------------- Preparation --------------------- */
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
