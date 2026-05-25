import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { sendVibrationPattern } from '../action';
import { screens } from '../App';
import { useBle } from '../BleContext';
import { styles } from '../styles';
import { VibrationPattern } from '../vibrationPatterns';

export type BleDevice = {
    name: string | null;
}

const chunkArray = (array: any[], chunkSize: number = 2) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

export default function HomeScreen({ navigation }: any) {
    const {
        connectedDevice,
        bleState,
        // devices,
        isScanning,
        isAdvertising,
        advertiseService,
        stopAdvertise,
        send,
        getConnectedDevices,
        scanForDevices,
        connect,
        disconnect,
    } = useBle();

    const [devices, setDevices] = useState<BleDevice[]>([]);

    const connectionStatus = connectedDevice
        ? { color: '#34C759', text: `Verbunden mit ${connectedDevice.name ?? "Gerät"}` }
        : isScanning
            ? { color: '#007AFF', text: 'Scannen...' }
            : isAdvertising ? { color: '#007AFF', text: 'Scannen...' }
                : { color: '#8e8e93', text: 'Nicht verbunden' };

    const twoColumnScreens = chunkArray(screens.slice(1, screens.length).map(def => def.label), 2)

    function Vibrate({ pattern }: { pattern: VibrationPattern }) {
        return <TouchableOpacity style={styles.scanButton} onPress={() => {
            sendVibrationPattern(pattern, { send });
        }}>
            <Text style={styles.scanButtonText}>Vibrations Test {JSON.stringify(pattern)}</Text>
        </TouchableOpacity>
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.connectionStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
                    <Text style={styles.statusLabel}>
                        {connectionStatus.text}
                    </Text>
                </View>

                {!connectedDevice && (
                    <>
                        {!isAdvertising ?
                            <TouchableOpacity style={styles.scanButton} onPress={advertiseService}>
                                <Text style={styles.scanButtonText}>Anbieten</Text>
                            </TouchableOpacity>
                            :
                            <TouchableOpacity style={styles.scanButton} onPress={stopAdvertise}>
                                <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                                <Text style={styles.scanButtonText}>Stop</Text>
                            </TouchableOpacity>
                        }
                        <TouchableOpacity style={styles.scanButton} onPress={async () => {
                            setDevices(await getConnectedDevices());
                        }}>
                            <Text style={styles.scanButtonText}>Geräte</Text>
                        </TouchableOpacity>
                        {/* {devices?.length && devices?.map(d => <div key={d}>asdf</div>)} */}
                        {!isScanning ?
                            <TouchableOpacity style={styles.scanButton} onPress={scanForDevices}>
                                <Text style={styles.scanButtonText}>Nach Gerät scannen</Text>
                            </TouchableOpacity>
                            :
                            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                        }

                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.deviceCard}
                                    onPress={() => connect(item)}
                                >
                                    <Text style={styles.deviceName}>
                                        {item.name ?? "Unbekanntes Gerät"}
                                    </Text>
                                    <Text style={styles.deviceHint}>Zum Verbinden tippen</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                !isScanning && devices.length === 0
                                    ? <Text style={styles.hint}>Keine Geräte gefunden.</Text>
                                    : null
                            }
                            scrollEnabled={false}
                            style={{ width: "100%", marginTop: 10 }}
                        />
                    </>
                )}

                {connectedDevice && (
                    <View style={styles.connectedActions}>
                        <Vibrate pattern={[100, 100]}/>
                        <Vibrate pattern={[100, 2000, 45, 100]}/>
                        <Vibrate pattern={[50, 100]}/>
                        <Vibrate pattern={[50, 2000]}/>
                        <Vibrate pattern={[35, 100]}/>
                        <Vibrate pattern={[35, 2000]}/>
                        <Vibrate pattern={[25, 100]}/>
                        <Vibrate pattern={[25, 2000]}/>
                            
                        <TouchableOpacity style={styles.scanButtonEx} onPress={() => {
                            Alert.alert(
                                "Verbindung trennen",
                                "Möchtest du die Verbindung wirklich trennen?",
                                [
                                    { text: "Abbrechen", style: "cancel" },
                                    { text: "Trennen", style: "destructive", onPress: disconnect }
                                ]
                            );
                        }}
                        >
                            <Text style={styles.scanButtonText}>Verbindung trennen</Text>
                        </TouchableOpacity>
                    </View>
                )}

            {bleState !== "PoweredOn" && (
                <Text style={styles.error}>
                    Bluetooth {bleState === "PoweredOff" ? "ist aus" : "nicht bereit"}.
                </Text>
            )}

            <Text style={[styles.h1, { marginTop: 40 }]}>Wähle deinen Modus</Text>

            <View style={styles.grid}>
                {
                    // [
                    //     ["⏱ Stoppuhr", "🔄 Interval"],
                    //     ["⬆️ Hochzählen", "⬇️ Runterzählen"],
                    //     ["🔃 Hoch in Runden", "🔃 Runter in Runden"],
                    //     ["🧨 Tabata", "🥊 F9Bad"],
                    //     ["🔥 Amrap", "⏰ Emom"],
                    //     ["🏃 Beeptest", "🎛️ Custom"]
                    // ]

                    twoColumnScreens
                        .map((row, rowIndex) => (
                            <View style={styles.row} key={rowIndex}>
                                {row.map((label) => (
                                    <TouchableOpacity
                                        key={label}
                                        style={styles.gridBtn}
                                        onPress={() => navigation.navigate(label)}
                                    >
                                        <Text style={styles.gridBtnText}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))
                }
            </View>
        </View>
        </ScrollView >
    );
}
