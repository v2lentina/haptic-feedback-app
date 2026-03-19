import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        padding: 20,
        paddingTop: 60,
    },

    stopwatchContainer: {
        flex: 1,
        alignItems: "center",
        padding: 20,
        paddingTop: 0,
    },

    h1: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 20,
    },

    connected: {
        fontSize: 17,
        marginVertical: 15,
        color: "green",
        textAlign: "center",
    },

    hint: {
        marginTop: 5,
        fontSize: 16,
        color: "gray",
    },

    error: {
        marginTop: 15,
        fontSize: 14,
        color: "#bb2222",
    },

    deviceBtn: {
        padding: 10,
        backgroundColor: "#ADD8E6",
        marginVertical: 5,
        borderRadius: 6,
    },

    deviceTxt: {
        fontSize: 16,
    },

    service: {
        fontSize: 14,
        color: "#444",
    },

    grid: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        marginTop: 10,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        width: '100%',
        gap: 12,
    },

    gridBtn: {
        backgroundColor: '#f9f9f9',
        width: '49%',
        maxWidth: 170,
        minHeight: 72,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        alignItems: 'flex-start',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 1,
    },

    gridBtnText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#222',
        textAlign: 'left',
        lineHeight: 22,
    },
    connectionCircleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },

    connectionCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#ccc',
    },
    connectionCircleScanning: {
        backgroundColor: '#007aff', //blue
    },

    connectionCircleConnected: {
        backgroundColor: '#34C759', //green
    },

    connectionCircleDisconnected: {
        backgroundColor: '#ccc', //grey
    },

    connectionCircleText: {
        fontSize: 32,
    },

    connectionCircleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    actionBtn: {
        backgroundColor: '#007aff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10,
        alignItems: 'center',
    },

    actionBtnDanger: {
        backgroundColor: '#ff3b30',
    },

    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    connectionStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },

    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },

    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    scanButton: {
        backgroundColor: '#007aff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignSelf: 'center',
    },

    scanButtonEx: {
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignSelf: 'center',
    },

    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    deviceCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },

    deviceName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1c1c1e',
    },

    deviceHint: {
        fontSize: 13,
        color: '#8e8e93',
        marginTop: 4,
    },

    connectedActions: {
        marginVertical: 20,
        alignItems: 'center',
    },

    scrollContainer: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40,
        flexGrow: 1,
    },

    disconnectText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff3b30',
    },

    disabledBtn: {
        backgroundColor: '#b0b0b0',
    },

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
    subLabel2: {
        fontSize: 14,
        color: "#444",
        marginBottom: 4,
        textAlign: "center",
    },

    time: {
        fontSize: 48,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        fontFamily: Platform.OS === 'ios' ? undefined : 'monospace',
        textAlign: 'center',
        color: '#000',
    },

    statusContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 20,
    },

    statusBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 10,
    },

    statusText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },

    statusConnected: {
        backgroundColor: "#34C759", //green
    },

    statusDisconnected: {
        backgroundColor: "#8e8e93", //grey
    },

    statusScanning: {
        backgroundColor: "#007aff", //blue
    },

    greenDot: {
        color: '#34C759',
        marginRight: 6,
        fontSize: 16,
    },

    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 6,
    },

    linkBlue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },

    linkRed: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FF3B30',
    },

    timerContainer: {
        marginBottom: 50,
        marginTop: 20,
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },

    startButton: {
        backgroundColor: '#34C759',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
    },

    stopButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
    },

    resetButton: {
        backgroundColor: '#8E8E93',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
    },

    pauseButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    progressContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        marginTop: 0,
        position: 'relative',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    timerOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
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
