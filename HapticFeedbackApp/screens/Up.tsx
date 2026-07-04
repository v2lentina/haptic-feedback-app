import { default as React, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { useBle } from '../BleContext';
import { input, styles } from '../styles';
import VibrationPatterns from '../vibrationPatterns';

export default function Up({ navigation }: { navigation: any }) {
    const [countdown, setCountdown] = useState(10);
    const [time, setTime] = useState(0);
    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [done, setDone] = useState(false);
    const [durationMin, setDurationMin] = useState("0");
    const [durationSec, setDurationSec] = useState("30");
    const [preparationEnabled, setPreparationEnabled] = useState(true);

    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const savedElapsedRef = useRef<number>(0);

    const backgroundAnim = useRef(new Animated.Value(0)).current;

    const { vibrate, startActivity, stopActivity } = useBle();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            reset();
        });
        return unsubscribe;
    }, [navigation]);

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

    const startTimer = async () => {
        await startActivity(`Up,`);
        Keyboard.dismiss();
        setStarted(true);

        if (preparationEnabled) {
            setCountdown(10);
            const prepInterval = setInterval(() => {
                setCountdown((c) => {
                    const next = c - 1;
                    if (next === 0) {
                        clearInterval(prepInterval);
                        vibrate(VibrationPatterns.BUZZ_ACTIVITY_START);
                        beginCountUp();
                    } else if (next <= 5) {
                        vibrate(VibrationPatterns.BUZZ_SHORT);
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(VibrationPatterns.BUZZ_ACTIVITY_START);
            beginCountUp();
        }
    };

    const beginCountUp = () => {
        setRunning(true);
        startTimeRef.current = Date.now();
        savedElapsedRef.current = 0;

        intervalRef.current = setInterval(async () => {
            const elapsed = Date.now() - startTimeRef.current;
            setTime(elapsed + savedElapsedRef.current);

            if (elapsed + savedElapsedRef.current >= getTotalMillis()) {
                clearInterval(intervalRef.current!);
                setRunning(false);
                setDone(true);
                await vibrate(VibrationPatterns.BUZZ_LONG);
                await stopActivity();
            }
        }, 50);
    };

    const pause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        savedElapsedRef.current += Date.now() - startTimeRef.current;
        setRunning(false);
        setPaused(true);
    };

    const resume = () => {
        setRunning(true);
        setPaused(false);
        const totalElapsed = getTotalMillis() - savedElapsedRef.current;

        if (totalElapsed <= 0) {
            vibrate(VibrationPatterns.BUZZ_LONG);
            setDone(true);
            setRunning(false);
            return;
        }

        setRunning(true);
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(async () => {
            const elapsed = Date.now() - startTimeRef.current;
            setTime(elapsed + savedElapsedRef.current);

            if (elapsed + savedElapsedRef.current >= getTotalMillis()) {
                clearInterval(intervalRef.current!);
                setRunning(false);
                setDone(true);
                await vibrate(VibrationPatterns.BUZZ_ACTIVITY_STOP);
                await stopActivity();
            }
        }, 50);
    };

    const reset = async () => {
        setStarted(false);
        setRunning(false);
        setPaused(false);
        setTime(0);
        setCountdown(10);
        setDone(false);
        savedElapsedRef.current = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        await stopActivity();
    };

    const getTotalMillis = () => {
        const min = parseInt(durationMin) || 0;
        const sec = parseInt(durationSec) || 0;
        return (min * 60 + sec) * 1000;
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const progress = started && getTotalMillis() > 0 ? Math.min(time / getTotalMillis(), 1) : 0;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {!started ? (
                        <>
                            <Text style={[styles.h1, { marginBottom: 20 }]}>Zielzeit angeben</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Minuten</Text>
                                    <TextInput
                                        value={durationMin}
                                        onChangeText={setDurationMin}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>

                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Sekunden</Text>
                                    <TextInput
                                        value={durationSec}
                                        onChangeText={setDurationSec}
                                        keyboardType="numeric"
                                        style={[input, { width: 100, height: 60, fontSize: 24 }]}
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>10s Vorbereitung</Text>
                                <Switch
                                    value={preparationEnabled}
                                    onValueChange={setPreparationEnabled}
                                />
                            </View>

                            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {done ? (
                                <>
                                    <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>
                                        ✅ Fertig!
                                    </Animated.Text>

                                    <TouchableOpacity style={styles.startButton} onPress={reset}>
                                        <Text style={styles.buttonText}>Neu starten</Text>
                                    </TouchableOpacity>
                                </>
                            ) : running || paused ? (
                                <>
                                    <View style={styles.progressContainer}>
                                        <Progress.Circle
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
