import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { styles } from '../styles';
import { useBle } from '../BleContext';

export default function HomeScreen({ navigation }: any) {
    const {
        connected,
        bleState,
        devices,
        scanning,
        scanForDevices,
        connect,
        disconnect,
    } = useBle();

    const connectionStatus = connected
        ? { color: '#34C759', text: `Verbunden mit ${connected.name ?? "Gerät"}` }
        : scanning
            ? { color: '#007AFF', text: 'Scannen...' }
            : { color: '#8e8e93', text: 'Nicht verbunden' };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.connectionStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
                    <Text style={styles.statusLabel}>
                        {connectionStatus.text}
                    </Text>
                </View>

                {!connected && (
                    <>
                        {!scanning && (
                            <TouchableOpacity style={styles.scanButton} onPress={scanForDevices}>
                                <Text style={styles.scanButtonText}>Nach Gerät scannen</Text>
                            </TouchableOpacity>
                        )}
                        {scanning && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />}

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
                                !scanning && devices.length === 0
                                    ? <Text style={styles.hint}>Keine Geräte gefunden.</Text>
                                    : null
                            }
                            scrollEnabled={false}
                            style={{ width: "100%", marginTop: 10 }}
                        />
                    </>
                )}

                {connected && (
                    <View style={styles.connectedActions}>
                        <TouchableOpacity
                            style={styles.scanButtonEx}
                            onPress={() => {
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
                    {[
                        ["⏱ Stoppuhr", "🔄 Interval"],
                        ["⬆️ Hochzählen", "⬇️ Runterzählen"],
                        ["🔃 Hoch in Runden", "🔃 Runter in Runden"],
                        ["🧨 Tabata", "🥊 F9Bad"],
                        ["🔥 Amrap", "⏰ Emom"],
                        ["🏃 Beeptest", "🎛️ Custom"]
                    ].map((row, rowIndex) => (
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
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
