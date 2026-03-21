import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.StringUtil;
import Toybox.Attention;
import Toybox.BluetoothLowEnergy;

function handleMessage(messageBuffer as ByteArray) as Void {
    var messageText = byteArrayToString(messageBuffer);

    var type = parseMessageType(messageText);
    switch (type) {
        case VIBRATION:
            handleVibationMessage(messageText);
        case OTHER:
            handleOtherMessage(messageText);
    }
}

function handleVibationMessage(messageText as String) as Void {
    var vibrationData = parseVibrationMessage(messageText);
    Attention.vibrate(vibrationData);
}

function handleOtherMessage(messageText as String) as Void {
    // do nothing, it's just a stub for possible additional functions
}