import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Easing,
    Keyboard,
    Switch,
} from 'react-native';
import { Buffer } from 'buffer';
import { manager, SERVICE_UUID, CHAR_UUID } from '../ble';
import * as Progress from 'react-native-progress';
import { styles, input } from '../styles';

export default function DownRd() {
    /* ---------- State ------------------------------------------------- */
    const [roundCount, setRoundCount] = useState('5');
    const [roundMinutes, setRoundMinutes] = useState('0');
    const [roundSeconds, setRoundSeconds] = useState('10');
    const [preparationEnabled, setPreparationEnabled] = useState(true);

    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [done, setDone] = useState(false);

    /* ---------- Refs -------------------------------------------------- */
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const roundStartRef = useRef<number>(0);
    const roundMillisRef = useRef<number>(0);
    const currentRoundRef = useRef<number>(1);

    /* ---------- UI-Animation ----------------------------------------- */
    const [circleKey, setCircleKey] = useState(0);            // <- für sauberen Neustart
    const backgroundAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(backgroundAnim, {
            toValue: running ? 1 : 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [running]);

    const backgroundColor = backgroundAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#f5f5f5', '#007AFF'],
    });
    const textColor = backgroundAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#000', '#fff'],
    });

    /* ---------- BLE Vibrate ------------------------------------------ */
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

    /* ---------- Timer-Logik ------------------------------------------ */
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
                        beginRounds();
                    }
                    return c - 1;
                });
            }, 1_000);
        } else {
            beginRounds();
        }
    };

    const beginRounds = () => {
        setRunning(true);
        const min = parseInt(roundMinutes) || 0;
        const sec = parseInt(roundSeconds) || 0;
        roundMillisRef.current = (min * 60 + sec) * 1_000;

        currentRoundRef.current = 1;
        setCurrentRound(1);
        startNextRound();
    };

    const startNextRound = () => {
        // full remaining zuerst setzen, damit progress-Ring im ersten Frame = 0
        setRemaining(roundMillisRef.current);
        setCircleKey(k => k + 1);             // neuer Progress-Circle
        roundStartRef.current = Date.now();
        setPaused(false);

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - roundStartRef.current;
            const left = Math.max(roundMillisRef.current - elapsed, 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate();

                if (currentRoundRef.current < parseInt(roundCount)) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startNextRound();
                } else {
                    setRunning(false);
                    setDone(true);
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
        // bei Countdown genügt es, startNextRound erneut zu starten,
        // aber wir müssen die verbleibende Zeit berücksichtigen:
        roundStartRef.current = Date.now() - (roundMillisRef.current - remaining);
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - roundStartRef.current;
            const left = Math.max(roundMillisRef.current - elapsed, 0);
            setRemaining(left);
            if (left <= 0) {
                clearInterval(intervalRef.current!);
                vibrate();
                if (currentRoundRef.current < parseInt(roundCount)) {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startNextRound();
                } else {
                    setRunning(false);
                    setDone(true);
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
        currentRoundRef.current = 1;
        setCurrentRound(1);
        setCircleKey(k => k + 1);
    };

    /* ---------- Hilfsfunktionen ------------------------------------- */
    const formatTime = (ms: number) => {
        const totalSec = Math.ceil(ms / 1_000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    // Countdown-Progress (1 → 0) wird zu 0 → 1 invertiert
    const progress =
        started && roundMillisRef.current > 0
            ? 1 - Math.min(remaining / roundMillisRef.current, 1)
            : 0;

    /* ---------- UI --------------------------------------------------- */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        /* -------------- Setup-Screen ---------------------------- */
                        <>
                            <Text style={[styles.h1, { marginBottom: 20 }]}>Runden einstellen</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Minuten</Text>
                                    <TextInput
                                        value={roundMinutes}
                                        onChangeText={setRoundMinutes}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>

                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Sekunden</Text>
                                    <TextInput
                                        value={roundSeconds}
                                        onChangeText={setRoundSeconds}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <Text style={[styles.subLabel, { marginBottom: 6 }]}>Anzahl Runden</Text>
                            <TextInput
                                value={roundCount}
                                onChangeText={setRoundCount}
                                keyboardType="numeric"
                                style={[input, { width: 100, height: 60, fontSize: 24, marginBottom: 20 }]}
                            />

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
                        /* -------------- Laufender Timer ------------------------ */
                        <>
                            {running || paused ? (
                                <>
                                    <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                        Runde {currentRound} von {roundCount}
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
                                /* -------------- Fertig-Screen ----------------------- */
                                <>
                                    <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ Fertig!
                                    </Animated.Text>
                                    <TouchableOpacity style={styles.startButton} onPress={reset}>
                                        <Text style={styles.buttonText}>Neu starten</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* -------------- Vorbereitung ------------------------- */
                                <>
                                    <Animated.Text style={[styles.time, { color: textColor }]}>{countdown}</Animated.Text>
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
