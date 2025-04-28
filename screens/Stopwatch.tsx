import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { styles } from '../styles';
import * as Progress from 'react-native-progress';

export default function StopwatchScreen() {
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

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

    const start = () => {
        if (running) return;
        setRunning(true);
        startTimeRef.current = Date.now() - time;
        intervalRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
        }, 50);
    };

    const stop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
    };

    const reset = () => {
        stop();
        setTime(0);
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const sec = (totalSec % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const progress = (time % 60000) / 60000;

    return (
        <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={running ? styles.stopButton : styles.startButton}
                        onPress={running ? stop : start}
                    >
                        <Animated.Text style={[styles.buttonText]}>
                            {running ? "Stop" : "Start"}
                        </Animated.Text>
                    </TouchableOpacity>

                    {!running && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={reset}
                        >
                            <Animated.Text style={[styles.buttonText]}>
                                Reset
                            </Animated.Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}
