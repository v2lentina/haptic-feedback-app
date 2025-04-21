import {Platform, StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", padding: 20, paddingTop: 60 },
    h1: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
    connected: { fontSize: 17, marginVertical: 15, color: "green", textAlign: "center" },
    hint: { marginTop: 25, fontSize: 16, color: "gray" },
    error: { marginTop: 15, fontSize: 14, color: "#bb2222" },
    deviceBtn: { padding: 10, backgroundColor: "#ADD8E6", marginVertical: 5, borderRadius: 6 },
    deviceTxt: { fontSize: 16 },
    service: { fontSize: 14, color: "#444" },

    // 👉 NEU HIER DRIN
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
    },
    subLabel: {
        fontSize: 14,
        color: "#444",
        marginBottom: 4,
    },
    time: {
        fontSize: 48,
        fontVariant: ["tabular-nums"],
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        letterSpacing: 2,
        marginBottom: 30,
    },
});

export const input = {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    width: 100,
    textAlign: 'center' as const,
    marginBottom: 20,
};
