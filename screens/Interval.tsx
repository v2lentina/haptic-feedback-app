// Interval.tsx -------------------------------------------------------------
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, Switch, TouchableOpacity,
    TouchableWithoutFeedback, Animated, Easing, Keyboard,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { styles, input } from '../styles';
import {vibrate, getLastDevice, softReconnect} from '../ble';

/* Farbcodes */
const WORK_COLOR  = '#007AFF'; // blau
const REST_COLOR  = '#FF9500'; // orange
const IDLE_COLOR  = '#f5f5f5';

const BUZZ_SHORT = 1;
const BUZZ_NORMAL = 3;
const BUZZ_LONG = 4;

type PhaseType = 'work' | 'rest';

export default function Interval() {
    /* ---------------------- Eingabe ---------------------- */
    const [workMin, setWorkMin] = useState('0');
    const [workSec, setWorkSec] = useState('20');
    const [restMin, setRestMin] = useState('0');
    const [restSec, setRestSec] = useState('10');
    const [rounds,   setRounds] = useState('8');
    const [countDownMode, setCountDown] = useState(false);

    /* ---------------------- Timer-State ------------------ */
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [countdown, setCountdown] = useState(10);

    const [started,  setStarted]  = useState(false);
    const [running,  setRunning]  = useState(false);
    const [paused,   setPaused]   = useState(false);
    const [done,     setDone]     = useState(false);

    const [inRest,   setInRest]   = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    const [timeValue, setTimeValue] = useState(0);     // ms (up oder down)

    /* ---------------------- Refs ------------------------- */
    const phaseStartRef = useRef<number>(0);
    const tickRef       = useRef<NodeJS.Timeout|null>(null);
    const prepRef       = useRef<NodeJS.Timeout|null>(null);
    const roundRef      = useRef(1);
    const curPhaseDur   = useRef(1); // ms

    /* ------------------- Hintergrund-Anim ---------------- */
    const bgAnim = useRef(new Animated.Value(0)).current; // 0 idle, 1 work, 2 rest
    const [circleKey, setCircleKey] = useState(0);

    useEffect(() => {
        const val = running ? (inRest ? 2 : 1) : 0;
        Animated.timing(bgAnim, {
            toValue: val,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [running, inRest]);

    const backgroundColor = bgAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [IDLE_COLOR, WORK_COLOR, REST_COLOR],
    });
    const textColor = bgAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['#000', '#fff', '#fff'],
    });

    /* -------------------- Helfer ------------------------- */
    const format = (ms: number) => {
        const totalSec = Math.ceil(ms/1000);
        const m = Math.floor(totalSec/60).toString().padStart(2,'0');
        const s = (totalSec % 60).toString().padStart(2,'0');
        return `${m}:${s}`;
    };

    const getDuration = (phase:PhaseType) => {
        const min = phase==='work' ? parseInt(workMin)||0 : parseInt(restMin)||0;
        const sec = phase==='work' ? parseInt(workSec)||0 : parseInt(restSec)||0;
        return (min*60 + sec)*1000;
    };

    /* -------------------- Timer-Logik -------------------- */
    const runPhase = (phase: PhaseType, doBuzz = true) => {
        if (doBuzz) {
            const totalRounds = parseInt(rounds);
            const isFinalRound = roundRef.current >= totalRounds;
            if (phase === 'work' && isFinalRound) {
                // kein runPhase('rest') mehr danach → letzte Phase
                vibrate(BUZZ_LONG);
            } else if (phase === 'work' && roundRef.current === 1) {
                vibrate(BUZZ_LONG);
            } else {
                vibrate(BUZZ_NORMAL);
            }
        }
        curPhaseDur.current = getDuration(phase);
        setInRest(phase==='rest');
        setCircleKey(k=>k+1);

        if (!countDownMode) setTimeValue(0);               // hochzählen
        else                setTimeValue(curPhaseDur.current); // runterzählen

        phaseStartRef.current = Date.now();
        clearInterval(tickRef.current!);
        tickRef.current = setInterval(()=>{
            const elapsed = Date.now()-phaseStartRef.current;
            const left    = curPhaseDur.current - elapsed;

            setTimeValue(countDownMode ? left : elapsed);

            if(elapsed>=curPhaseDur.current){
                clearInterval(tickRef.current!);

                if(phase==='work'){
                    if(roundRef.current >= parseInt(rounds)){
                        finish();
                    }else{
                        runPhase('rest');
                    }
                }else{
                    roundRef.current +=1;
                    setCurrentRound(roundRef.current);
                    runPhase('work');
                }
            }
        },50);
    };

    const begin = ()=>{ setRunning(true); runPhase('work', false); };

    const start = async () => {
        if (parseInt(rounds) <= 0 || getDuration('work') <= 0) return;

        Keyboard.dismiss();
        setStarted(true);
        setRunning(false);
        setPaused(false);
        setDone(false);
        roundRef.current = 1;
        setCurrentRound(1);

        if (prepEnabled) {
            const lastId = await getLastDevice();
            if (lastId) softReconnect(lastId);
            setCountdown(10);
            prepRef.current = setInterval(() => {
                setCountdown(c => {
                    const next = c - 1;
                    if (next > 0 && next <= 3) {
                        vibrate(BUZZ_SHORT);
                    }
                    if (next === 0) {
                        clearInterval(prepRef.current!);
                        vibrate(BUZZ_LONG);
                        begin();
                    }
                    return next;
                });
            }, 1000);
        } else {
            vibrate(BUZZ_LONG);
            begin();
        }
    };

    const pause = ()=>{
        clearInterval(tickRef.current!);
        setRunning(false); setPaused(true);
    };

    const resume = ()=>{
        setPaused(false); setRunning(true);
        const already = countDownMode
            ? curPhaseDur.current - timeValue
            : timeValue;
        phaseStartRef.current = Date.now()-already;
        tickRef.current = setInterval(()=>{
            const elapsed = Date.now()-phaseStartRef.current;
            const left    = curPhaseDur.current - elapsed;
            setTimeValue(countDownMode ? left : elapsed);
            if(elapsed>=curPhaseDur.current){
                clearInterval(tickRef.current!);
                if(inRest){
                    roundRef.current +=1; setCurrentRound(roundRef.current);
                    runPhase('work');
                }else{
                    if(roundRef.current>=parseInt(rounds)) finish();
                    else runPhase('rest');
                }
            }
        },50);
    };

    const reset = ()=>{
        clearInterval(tickRef.current!); clearInterval(prepRef.current!);
        setStarted(false); setRunning(false); setPaused(false); setDone(false);
        setCountdown(10); setTimeValue(0); setInRest(false); roundRef.current=1; setCurrentRound(1);
    };

    const finish=()=>{ setRunning(false); setDone(true); vibrate(BUZZ_LONG); };

    /* ------------- Progress (0-1) ------------- */
    const prog = running||paused
        ? (countDownMode
            ? 1 - Math.max(0,timeValue)/curPhaseDur.current
            : Math.min(timeValue/curPhaseDur.current,1))
        : 0;

    /* --------------------- UI ------------------ */
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stopwatchContainer,{backgroundColor}]}>
                <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>

                    {/* ---------- SETUP ---------- */}
                    {!started ? (
                        <>
                            <Text style={[styles.h1,{marginBottom:20}]}>Intervall</Text>

                            {/* Arbeits­zeit */}
                            <Text style={[styles.subLabel,{color:'#666'}]}>Arbeitszeit</Text>
                            <View style={{flexDirection:'row',marginBottom:16}}>
                                <View style={{alignItems:'center',marginHorizontal:10}}>
                                    <Text style={[styles.subLabel,{color:'#666'}]}>Min</Text>
                                    <TextInput value={workMin} onChangeText={setWorkMin} keyboardType="numeric"
                                               style={[input,{width:80,height:60,fontSize:24,textAlign:'center'}]}/>
                                </View>
                                <View style={{alignItems:'center',marginHorizontal:10}}>
                                    <Text style={[styles.subLabel,{color:'#666'}]}>Sek</Text>
                                    <TextInput value={workSec} onChangeText={setWorkSec} keyboardType="numeric"
                                               style={[input,{width:80,height:60,fontSize:24,textAlign:'center'}]}/>
                                </View>
                            </View>

                            {/* Pause­zeit */}
                            <Text style={[styles.subLabel,{color:'#666'}]}>Pausenzeit</Text>
                            <View style={{flexDirection:'row',marginBottom:16}}>
                                <View style={{alignItems:'center',marginHorizontal:10}}>
                                    <Text style={[styles.subLabel,{color:'#666'}]}>Min</Text>
                                    <TextInput value={restMin} onChangeText={setRestMin} keyboardType="numeric"
                                               style={[input,{width:80,height:60,fontSize:24,textAlign:'center'}]}/>
                                </View>
                                <View style={{alignItems:'center',marginHorizontal:10}}>
                                    <Text style={[styles.subLabel,{color:'#666'}]}>Sek</Text>
                                    <TextInput value={restSec} onChangeText={setRestSec} keyboardType="numeric"
                                               style={[input,{width:80,height:60,fontSize:24,textAlign:'center'}]}/>
                                </View>
                            </View>

                            {/* Runden */}
                            <Text style={[styles.subLabel,{color:'#666'}]}>Runden</Text>
                            <TextInput value={rounds} onChangeText={setRounds} keyboardType="numeric"
                                       style={[input,{width:100,height:60,fontSize:24,textAlign:'center',marginBottom:20}]}/>

                            {/* Count-Direction */}
                            <View style={{flexDirection:'row',alignItems:'center',marginBottom:12}}>
                                <Text style={[styles.subLabel,{color:'#666',marginRight:8}]}>Zählrichtung</Text>
                                <Switch value={countDownMode} onValueChange={setCountDown}/>
                                <Text style={[styles.subLabel,{marginLeft:8}]}>{countDownMode?'⬇️':'⬆️'}</Text>
                            </View>

                            {/* Vorbereitung */}
                            <View style={{flexDirection:'row',alignItems:'center',marginBottom:30}}>
                                <Text style={[styles.subLabel,{color:'#666',marginRight:10}]}>10 s Vorbereitung</Text>
                                <Switch value={prepEnabled} onValueChange={setPrepEnabled}/>
                            </View>

                            <TouchableOpacity style={styles.startButton} onPress={start}>
                                <Text style={styles.buttonText}>Start</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        /* ---------- TIMER ---------- */
                        <>
                            {(running||paused) ? (
                                <>
                                    <Text style={[styles.subLabel,{color:'#fff',marginBottom:8}]}>
                                        Runde {currentRound}/{rounds} – {inRest?'Pause':'Work'}
                                    </Text>

                                    <View style={styles.progressContainer}>
                                        <Progress.Circle key={circleKey} size={250} progress={prog}
                                                         color="#fff" borderWidth={4} thickness={8}
                                                         unfilledColor="rgba(255,255,255,0.2)" animated direction="clockwise" />
                                        <View style={styles.timerOverlay}>
                                            <Animated.Text style={[styles.time,{color:textColor}]}>
                                                {format(timeValue)}
                                            </Animated.Text>
                                        </View>
                                    </View>

                                    <View style={{flexDirection:'row',marginTop:30,gap:20}}>
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
                                    <Animated.Text style={[styles.time,{color:textColor,marginBottom:20}]}>
                                        ✅ Fertig!
                                    </Animated.Text>
                                    <TouchableOpacity style={styles.startButton} onPress={reset}>
                                        <Text style={styles.buttonText}>Neu starten</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* Vorbereitung */
                                <>
                                    <Animated.Text style={[styles.time,{color:textColor}]}>{countdown}</Animated.Text>
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
