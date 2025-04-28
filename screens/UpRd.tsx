import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, Easing, Keyboard, TouchableWithoutFeedback, Switch } from 'react-native';
import { Buffer } from 'buffer';
import { BleManager } from 'react-native-ble-plx';
import { styles, input } from '../styles';
import * as Progress from 'react-native-progress';

const SERVICE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
const CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

const manager = new BleManager();

export default function UpRd() {
    const [roundCount, setRoundCount] = useState("5");
    const [countdown, setCountdown] = useState(10);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [done, setDone] = useState(false);

    const [roundMinutes, setRoundMinutes] = useState("0");
    const [roundSeconds, setRoundSeconds] = useState("10");
    const [preparationEnabled, setPreparationEnabled] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(0);
    const currentRoundRef = useRef(1);
    const roundDurationMillisRef = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0);
    const [circleKey, setCircleKey] = useState(0);
    const backgroundAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(backgroundAnim, {
            toValue: running ? 1 : 0,
            duration: 500,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease),
        }).start();
    }, [running]);

    const backgroundColor = backgroundAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#f5f5f5', '#007AFF'],
    });

    const textColor = backgroundAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#000000', '#ffffff'],
    });

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
        Keyboard.dismiss();
        setStarted(true);

        vibrate(); // vibrieren beim Start

        if (preparationEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown((c) => {
                    if (c === 1) {
                        clearInterval(prep);
                        vibrate();
                        beginRoundTimer();
                    }
                    return c - 1;
                });
            }, 1000);
        } else {
            beginRoundTimer();
        }
    };

    const beginRoundTimer = () => {
        setRunning(true);
        startTimeRef.current = Date.now();
        roundStartTimeRef.current = Date.now();
        savedElapsedRef.current = 0;

        const min = parseInt(roundMinutes) || 0;
        const sec = parseInt(roundSeconds) || 0;
        roundDurationMillisRef.current = (min * 60 + sec) * 1000;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const currentRoundElapsed = now - roundStartTimeRef.current + savedElapsedRef.current;

            setTime(currentRoundElapsed);

            if (currentRoundElapsed >= roundDurationMillisRef.current) {
                if (currentRoundRef.current < parseInt(roundCount)) {
                    vibrate();
                    setCircleKey(k => k + 1);
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    roundStartTimeRef.current = Date.now();
                    savedElapsedRef.current = 0;
                    setTime(0);
                } else {
                    clearInterval(intervalRef.current!);
                    vibrate();
                    setRunning(false);
                    setDone(true);
                }
            }
        }, 50);
    };

    const pause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        savedElapsedRef.current += Date.now() - roundStartTimeRef.current;
        setRunning(false);
        setPaused(true);
    };

    const resume = () => {
        setRunning(true);
        roundStartTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const currentRoundElapsed = now - roundStartTimeRef.current + savedElapsedRef.current;

            setTime(currentRoundElapsed);

            if (currentRoundElapsed >= roundDurationMillisRef.current) {
                if (currentRoundRef.current < parseInt(roundCount)) {
                    vibrate();
                    setCircleKey(k => k + 1);
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    roundStartTimeRef.current = Date.now();
                    savedElapsedRef.current = 0;
                    setTime(0);
                } else {
                    clearInterval(intervalRef.current!);
                    vibrate();
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
        setTime(0);
        setCountdown(10);
        setDone(false);
        currentRoundRef.current = 1;
        setCurrentRound(1);
        savedElapsedRef.current = 0;
        setCircleKey(k => k + 1);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const progress = started && roundDurationMillisRef.current > 0 ? Math.min(time / roundDurationMillisRef.current, 1) : 0;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
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
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>10s Vorbereitung</Text>
                                <Switch
                                    value={preparationEnabled}
                                    onValueChange={setPreparationEnabled}
                                />
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
                                            showsText={false}
                                            unfilledColor="rgba(255,255,255,0.2)"
                                            animated={true}
                                            direction="clockwise"
                                        />
                                        <View style={styles.timerOverlay}>
                                            <Animated.Text style={[styles.time, { color: textColor }]}>
                                                {formatTime(time)}
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
                                    <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ Fertig!
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
                                    <Text style={[styles.subLabel]}>Vorbereitung</Text>
                                </>
                            )}
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
