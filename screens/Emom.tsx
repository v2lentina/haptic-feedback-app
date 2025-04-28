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
import { BleManager } from 'react-native-ble-plx';
import * as Progress from 'react-native-progress';
import { styles, input } from '../styles';

const SERVICE_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const CHAR_UUID    = '19b10002-e8f2-537e-4f6c-d104768a1214';
const manager      = new BleManager();

export default function Emom() {
    /* ---------- State & Refs ---------- */
    const [rounds, setRounds]             = useState('10');
    const [prepEnabled, setPrepEnabled]   = useState(true);

    const [countdown, setCountdown]       = useState(10);
    const [started, setStarted]           = useState(false);
    const [running, setRunning]           = useState(false);
    const [paused, setPaused]             = useState(false);
    const [done, setDone]                 = useState(false);

    const [currentRound, setCurrentRound] = useState(1);
    const [elapsed, setElapsed]           = useState(0); // innerhalb Minute

    const roundRef        = useRef(1);
    const startRef        = useRef<number>(0);
    const tickRef         = useRef<NodeJS.Timeout|null>(null);
    const switchRef       = useRef<NodeJS.Timeout|null>(null);

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

    const progress = elapsed / 60_000; // 0 → 1

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

    /* ---------- Logic ---------- */
    const tickMinute = () => {
        tickRef.current && clearInterval(tickRef.current);
        tickRef.current = setInterval(() => {
            setElapsed(Date.now() - startRef.current);
        }, 200);
    };

    const startMinute = (total: number) => {
        setCircleKey(k => k + 1);
        vibrate();
        startRef.current = Date.now();
        setElapsed(0);
        tickMinute();

        switchRef.current && clearTimeout(switchRef.current);
        switchRef.current = setTimeout(() => {
            clearInterval(tickRef.current!);

            if (roundRef.current >= total) {
                vibrate();
                setRunning(false);
                setDone(true);
            } else {
                roundRef.current += 1;
                setCurrentRound(roundRef.current);
                startMinute(total);
            }
        }, 60_000);
    };

    const beginEmom = (total: number) => {
        setRunning(true);
        roundRef.current = 1;
        setCurrentRound(1);
        startMinute(total);
    };

    const start = () => {
        const total = parseInt(rounds);
        if (!total || total < 1) return;

        Keyboard.dismiss();
        setStarted(true);

        if (prepEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    if (c === 1) {
                        clearInterval(prep);
                        beginEmom(total);
                    }
                    return c - 1;
                });
            }, 1_000);
        } else {
            beginEmom(total);
        }
    };

    const pause = () => {
        clearInterval(tickRef.current!);
        clearTimeout(switchRef.current!);
        setPaused(true);
        setRunning(false);
    };

    const resume = () => {
        setRunning(true);
        setPaused(false);

        // verbleibende Zeit der Minute
        const left = 60_000 - elapsed;
        startRef.current = Date.now() - elapsed;
        tickMinute();

        switchRef.current = setTimeout(() => {
            clearInterval(tickRef.current!);
            if (roundRef.current >= parseInt(rounds)) {
                vibrate();
                setRunning(false);
                setDone(true);
            } else {
                roundRef.current += 1;
                setCurrentRound(roundRef.current);
                startMinute(parseInt(rounds));
            }
        }, left);
    };

    const reset = () => {
        clearInterval(tickRef.current!);
        clearTimeout(switchRef.current!);
        setStarted(false);
        setRunning(false);
        setPaused(false);
        setDone(false);
        setCurrentRound(1);
        setElapsed(0);
        setCountdown(10);
        setCircleKey(k => k + 1);
    };

    const timeStr = (ms: number) =>
        `00:${Math.floor(ms / 1_000).toString().padStart(2, '0')}`;

    /* ---------- UI ---------- */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        <>
                            <Text style={[styles.h1, { marginBottom: 20 }]}>Emom</Text>
                            <Text style={[styles.subLabel2, { color: '#666', marginBottom: 20 }]}>
                                Every Minute On the Minute – Übung startet zu jeder vollen Minute, Rest der Minute ist Pause
                            </Text>
                            {/* ===== neues Feld-Layout ===== */}
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={[styles.subLabel, { color: '#666' }]}>Minuten / Runden</Text>
                                <TextInput
                                    value={rounds}
                                    onChangeText={setRounds}
                                    keyboardType="numeric"
                                    style={[
                                        input,
                                        { width: 120, height: 60, fontSize: 24, textAlign: 'center' },
                                    ]}
                                    placeholder="10"
                                />
                            </View>
                            {/* ============================ */}

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
                                    <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                        Runde {currentRound} von {rounds}
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
                                                {timeStr(elapsed)}
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
                                <>
                                    <Animated.Text
                                        style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ EMOM abgeschlossen!
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
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
