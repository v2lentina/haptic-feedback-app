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

export default function DownRd({ navigation }: { navigation: any }) {
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

    const intervalRef = useRef<number | null>(null);
    const roundStartRef = useRef<number>(0);
    const roundMillisRef = useRef<number>(0);
    const currentRoundRef = useRef<number>(1);
    const savedElapsedRef = useRef<number>(0);

    const [circleKey, setCircleKey] = useState(0);
    const backgroundAnim = useRef(new Animated.Value(0)).current;

    const { vibrate } = useBle();

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

    const start = async () => {
        Keyboard.dismiss();
        setStarted(true);

        if (preparationEnabled) {
            setCountdown(10);
            const prep = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next > 0 && next <= 3) vibrate(VibrationPatterns.BUZZ_SHORT);
                    if (next === 0) {
                        clearInterval(prep);
                        vibrate(VibrationPatterns.BUZZ_LONG);
                        beginRounds();
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(VibrationPatterns.BUZZ_LONG);
            beginRounds();
        }
    };

    const beginRounds = () => {
        setRunning(true);
        setPaused(false);
        setDone(false);
        const min = parseInt(roundMinutes) || 0;
        const sec = parseInt(roundSeconds) || 0;
        roundMillisRef.current = (min * 60 + sec) * 1000;

        currentRoundRef.current = 1;
        setCurrentRound(1);
        savedElapsedRef.current = 0;
        startNextRound();
    };

    const startNextRound = () => {
        setRemaining(roundMillisRef.current);
        setCircleKey(k => k + 1);
        roundStartRef.current = Date.now();
        savedElapsedRef.current = 0;

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - roundStartRef.current;
            const left = Math.max(roundMillisRef.current - (elapsed + savedElapsedRef.current), 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                const finalRound = currentRoundRef.current >= parseInt(roundCount);
                vibrate(finalRound ? VibrationPatterns.BUZZ_LONG : VibrationPatterns.BUZZ_NORMAL);

                if (finalRound) {
                    setRunning(false);
                    setDone(true);
                } else {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    startNextRound();
                }
            }
        }, 50);
    };

    const pause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        savedElapsedRef.current += Date.now() - roundStartRef.current;
        setPaused(true);
        setRunning(false);
    };

    const resume = () => {
        setRunning(true);
        setPaused(false);
        roundStartRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - roundStartRef.current;
            const left = Math.max(roundMillisRef.current - (elapsed + savedElapsedRef.current), 0);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(intervalRef.current!);
                const finalRound = currentRoundRef.current >= parseInt(roundCount);
                vibrate(finalRound ? VibrationPatterns.BUZZ_LONG : VibrationPatterns.BUZZ_NORMAL);

                if (finalRound) {
                    setRunning(false);
                    setDone(true);
                } else {
                    currentRoundRef.current += 1;
                    setCurrentRound(currentRoundRef.current);
                    savedElapsedRef.current = 0;
                    startNextRound();
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
        savedElapsedRef.current = 0;
        setCircleKey(k => k + 1);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.ceil(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const progress = started && roundMillisRef.current > 0
        ? 1 - Math.min(remaining / roundMillisRef.current, 1)
        : 0;

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
                                    <TextInput value={roundMinutes} onChangeText={setRoundMinutes} keyboardType="numeric" style={[input, { width: 100, height: 60, fontSize: 24 }]} placeholder="0" />
                                </View>
                                <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Sekunden</Text>
                                    <TextInput value={roundSeconds} onChangeText={setRoundSeconds} keyboardType="numeric" style={[input, { width: 100, height: 60, fontSize: 24 }]} placeholder="0" />
                                </View>
                            </View>
                            <Text style={[styles.subLabel, { marginBottom: 6 }]}>Anzahl Runden</Text>
                            <TextInput value={roundCount} onChangeText={setRoundCount} keyboardType="numeric" style={[input, { width: 100, height: 60, fontSize: 24, marginBottom: 20 }]} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>10s Vorbereitung</Text>
                                <Switch value={preparationEnabled} onValueChange={setPreparationEnabled} />
                            </View>
                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>
                        </>
                    ) : done ? (
                        <>
                            <Animated.Text style={[styles.time, { color: textColor, marginBottom: 20 }]}>✅ Fertig!</Animated.Text>
                            <TouchableOpacity style={styles.startButton} onPress={reset}>
                                <Text style={styles.buttonText}>Neu starten</Text>
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
                                        <Progress.Circle key={circleKey} size={250} progress={progress} color="#ffffff" borderWidth={4} thickness={8} unfilledColor="rgba(255,255,255,0.2)" animated direction="clockwise" />
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
