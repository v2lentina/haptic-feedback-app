import AsyncStorage from '@react-native-async-storage/async-storage';
import { default as React, useEffect, useRef, useState } from 'react';
import {
    Animated, Easing,
    FlatList,
    Keyboard,
    Switch,
    Text, TextInput,
    TouchableOpacity, TouchableWithoutFeedback,
    View,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useBle } from '../BleContext';
import { input, styles } from '../styles';
import VibrationPatterns from '../vibrationPatterns';

type Kind = 'work' | 'rest';
type Phase = { label: string; duration: number; kind: Kind };

const STORAGE_KEY = 'customTimer.phases';

export default function Custom({ navigation }: { navigation: any }) {
    const [label, setLabel] = useState('');
    const [min, setMin] = useState('0');
    const [sec, setSec] = useState('30');
    const [kind, setKind] = useState<Kind>('work');
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const [phases, setPhases] = useState<Phase[]>([]);
    const [prepEnabled, setPrepEnabled] = useState(true);

    const [started, setStarted] = useState(false);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [done, setDone] = useState(false);

    const [countdown, setCountdown] = useState(10);
    const [current, setCurrent] = useState(0);
    const [timeLeft, setLeft] = useState(0);
    const [phaseDur, setPhaseDur] = useState(1);

    const [circleKey, setCircleKey] = useState(0);
    const bg = useRef(new Animated.Value(0)).current;
    const [bgColorTarget, setBgColorTarget] = useState('#007AFF');

    const { vibrate, startActivity, stopActivity } = useBle();

    useEffect(() => {
        Animated.timing(bg, {
            toValue: running ? 1 : 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [running, bgColorTarget]);

    const backgroundColor = bg.interpolate({
        inputRange: [0, 1],
        outputRange: ['#f5f5f5', bgColorTarget],
    });
    const textColor = bg.interpolate({
        inputRange: [0, 1],
        outputRange: ['#000', '#fff'],
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            resetAllState();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(json => {
            if (json) setPhases(JSON.parse(json));
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(phases));
    }, [phases]);


    const format = (s: number) => {
        const total = Math.ceil(s);
        const m = Math.floor(total / 60).toString().padStart(2, '0');
        const ss = (total % 60).toString().padStart(2, '0');
        return `${m}:${ss}`;
    };

    const addOrUpdatePhase = () => {
        const m = parseInt(min) || 0, s = parseInt(sec) || 0, total = m * 60 + s;
        if (total <= 0) return;

        const data: Phase = {
            label: label.trim() || `Phase ${editIdx !== null ? editIdx + 1 : phases.length + 1}`,
            duration: total,
            kind,
        };

        setPhases(p =>
            editIdx === null
                ? [...p, data]
                : p.map((ph, i) => i === editIdx ? data : ph)
        );

        setLabel('');
        setMin('0');
        setSec('30');
        setKind('work');
        setEditIdx(null);
    };

    const deletePhase = (idx: number) =>
        setPhases(p => p.filter((_, i) => i !== idx));

    const loadForEdit = (idx: number) => {
        const p = phases[idx];
        setEditIdx(idx);
        setLabel(p.label);
        setMin(String(Math.floor(p.duration / 60)));
        setSec(String(p.duration % 60));
        setKind(p.kind);
    };

    const tickRef = useRef<number | null>(null);
    const prepRef = useRef<number | null>(null);

    const runPhase = (idx: number) => {
        if (idx >= phases.length) { finish(); return; }

        vibrate(VibrationPatterns.BUZZ_NORMAL);
        const { duration, kind } = phases[idx];
        setBgColorTarget(kind === 'work' ? '#007AFF' : '#FF9500');
        setCurrent(idx);
        setPhaseDur(duration);
        setLeft(duration);
        setCircleKey(k => k + 1);

        clearInterval(tickRef.current!);
        tickRef.current = setInterval(() => {
            setLeft(t => {
                if (t <= 0.05) {
                    clearInterval(tickRef.current!);
                    setTimeout(() => runPhase(idx + 1), 0);
                    return 0;
                }
                return t - 0.05;
            });
        }, 50);
    };

    const begin = () => { setRunning(true); runPhase(0); };

    const start = async () => {
        if (!phases.length) return;

        await startActivity(`Custom,${phases.length} Phases`);
        Keyboard.dismiss();
        setStarted(true);
        setRunning(false);
        setPaused(false);
        setDone(false);
        vibrate(VibrationPatterns.BUZZ_NORMAL);

        if (prepEnabled) {
            setCountdown(10);
            prepRef.current = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next > 0 && next <= 3) {
                        vibrate(VibrationPatterns.BUZZ_SHORT);
                    }
                    if (next === 0) {
                        clearInterval(prepRef.current!);
                        vibrate(VibrationPatterns.BUZZ_ACTIVITY_START);
                        begin();
                    }
                    return next;
                });
            }, 1000);
        } else {
            begin();
        }
    };

    const pause = () => {
        clearInterval(tickRef.current!); setRunning(false); setPaused(true); };
    const resume = () => {
        setPaused(false); setRunning(true);
        tickRef.current = setInterval(() => {
            setLeft(t => {
                if (t <= 1) { clearInterval(tickRef.current!); setTimeout(() => runPhase(current + 1), 0); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    const resetAllState = async () => {
        await stopActivity();
        clearInterval(tickRef.current!); clearInterval(prepRef.current!);
        setStarted(false); setRunning(false); setPaused(false); setDone(false);
        setCurrent(0); setLeft(0); setCountdown(10);
    };
    const finish = async () => {
        setRunning(false); setDone(true);
        await vibrate(VibrationPatterns.BUZZ_ACTIVITY_STOP);
        await stopActivity();
    };

    const clearPhases = () => setPhases([]);

    const progress = 1 - timeLeft / phaseDur;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer, { backgroundColor }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                    {!started ? (
                        <>
                            <Text style={[styles.h1, { marginBottom: 10 }]}>Custom Timer</Text>

                            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Name</Text>
                                    <TextInput value={label} onChangeText={setLabel}
                                        placeholder="Push-Ups"
                                        style={[input, { width: 140, height: 60, fontSize: 24 }]} />
                                </View>
                                <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Min</Text>
                                    <TextInput value={min} onChangeText={setMin} keyboardType="numeric"
                                        style={[input, { width: 70, height: 60, fontSize: 24, textAlign: 'center' }]} />
                                </View>
                                <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
                                    <Text style={[styles.subLabel, { color: '#666' }]}>Sek</Text>
                                    <TextInput value={sec} onChangeText={setSec} keyboardType="numeric"
                                        style={[input, { width: 70, height: 60, fontSize: 24, textAlign: 'center' }]} />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>Pause?</Text>
                                <Switch value={kind === 'rest'} onValueChange={v => setKind(v ? 'rest' : 'work')} />
                            </View>

                            <TouchableOpacity style={styles.startButton} onPress={addOrUpdatePhase}>
                                <Text style={styles.buttonText}>
                                    {editIdx === null ? '➕ Phase hinzufügen' : '💾 Phase aktualisieren'}
                                </Text>
                            </TouchableOpacity>

                            <FlatList
                                data={phases}
                                keyExtractor={(_, i) => i.toString()}
                                style={{ marginVertical: 20, maxHeight: 180, alignSelf: 'stretch' }}
                                renderItem={({ item, index }) => (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginVertical: 2,
                                            width: '100%',
                                        }}>
                                        <Text
                                            style={{
                                                flex: 1,
                                                fontSize: 16,
                                                marginRight: 6,
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode="tail">
                                            {`${index + 1}. ${item.kind === 'rest' ? '🟠' : '🔵'} ${item.label} – ${format(
                                                item.duration,
                                            )}`}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => loadForEdit(index)}
                                            style={{ width: 28, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 18 }}>📝</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => deletePhase(index)}
                                            style={{ width: 28, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 18 }}>🗑</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={[styles.subLabel, { color: '#666', marginRight: 10 }]}>10 s Vorbereitung</Text>
                                <Switch value={prepEnabled} onValueChange={setPrepEnabled} />
                            </View>

                            <TouchableOpacity
                                style={[styles.startButton, { opacity: phases.length ? 1 : 0.4 }]}
                                onPress={start} disabled={!phases.length}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>

                            {phases.length > 0 && (
                                <TouchableOpacity style={[styles.stopButton, { marginTop: 12 }]} onPress={clearPhases}>
                                    <Text style={styles.buttonText}>Alles löschen</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <>
                            {(running || paused) ? (
                                <>
                                    <Text style={[styles.subLabel, { color: '#fff', marginBottom: 8 }]}>
                                        Phase {current + 1}/{phases.length}: {phases[current]?.label}
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
                                                {format(timeLeft)}
                                            </Animated.Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', marginTop: 30, gap: 20 }}>
                                        <TouchableOpacity style={styles.stopButton} onPress={resetAllState}>
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
                                    <TouchableOpacity style={styles.startButton} onPress={resetAllState}>
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
