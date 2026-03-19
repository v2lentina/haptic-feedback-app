import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.StringUtil;
import Toybox.Attention;

// from https://forums.garmin.com/developer/connect-iq/f/discussion/196954/convert-byte-array-to-string/961973
function byteArrayToString(byte_array) {
    var options = {
        :fromRepresentation => StringUtil.REPRESENTATION_BYTE_ARRAY,
        :toRepresentation => StringUtil.REPRESENTATION_STRING_PLAIN_TEXT,
		:encoding => StringUtil.CHAR_ENCODING_UTF8
    };

	// System.println(Lang.format("Converting '$1$' to String", [ byte_array ]));
    var result = StringUtil.convertEncodedString(byte_array, options);
    // System.println(Lang.format("           '$1$'..", [ result ]));

    return result;
}

// from https://forums.garmin.com/developer/connect-iq/f/discussion/196954/convert-byte-array-to-string/961973
function stringToByteArray(plain_text) {
    var options = {
		:fromRepresentation => StringUtil.REPRESENTATION_STRING_PLAIN_TEXT,
        :toRepresentation => StringUtil.REPRESENTATION_BYTE_ARRAY,
        :encoding => StringUtil.CHAR_ENCODING_UTF8
    };

    // System.println(Lang.format("Converting '$1$' to ByteArray", [ plain_text ]));
    var result = StringUtil.convertEncodedString(plain_text, options);
    // System.println(Lang.format("           '$1$'..", [ result ]));

    return result;
}

enum MessageType {
    VIBRATION,
    OTHER
}

function parseMessageType(messageText as String) as MessageType {
    var firstColonIndex = messageText.find(",");

    if (firstColonIndex == null) {
        throw new SymbolNotAllowedException("no colon found in the entire message, violating protocol, aborting");
    }

    var typeText = messageText.substring(0, firstColonIndex);

    switch (typeText) {
        case "VIBRATION":
            return VIBRATION;
        case "OTHER":
            return OTHER;
        default:
            throw new SymbolNotAllowedException("specified type unknown, maybe a new version of the protocol?");
    }
}

// [vibrationMessageText] is the message as parsed text, see [byteArrayToString]
function parseVibrationMessage(vibrationMessageText as String) as [VibeProfile] {
    var hasOpeningBracket = vibrationMessageText.find("[") == 0;
    var hasClosingBracket = vibrationMessageText.find("]") == vibrationMessageText.length();

    if (!hasOpeningBracket) {
        // failure, didn't adhere protocol
        throw new SymbolNotAllowedException("message had no opening bracket '['");
    }

    if (!hasClosingBracket) {
        // failure didn't adhere protocol
        throw new SymbolNotAllowedException("message had no closing bracket ']'");
    }

    return parseVibrationPattern(vibrationMessageText.substring(1,vibrationMessageText.length()-1));
}

function parseVibrationPattern(vibrationPatternText as String) as [VibeProfile] {
    var splits = split(vibrationPatternText, ",");

    var validNumberOfEntries = splits.size() % 2 == 0;
    if (!validNumberOfEntries) {
        throw new SymbolNotAllowedException("invalid number of entries, needs to be a non-zero even number. This is because the first number determines the strength (0..100), with the immediately following number determining the playtime in milliseconds.");
    }

    var vibrationData = [] as [VibeProfile];

    for (var index = 0; index < splits.size()-1; index+=2) {
        var strength = splits[index].toNumber();
        var durationMs = splits[index+1].toNumber();

        if (strength < 0 || strength > 100) {
            throw new SymbolNotAllowedException("strength was invalid! (0..100) index: " + (index+1).toString() + ", value: "+strength.toString());
        }

        if (durationMs < 0) {
            throw new SymbolNotAllowedException("duration was negative! for index: " + (index+1).toString()+ ", value: "+durationMs.toString());
        }
        // sanitize
        if (durationMs > 1000) {
            throw new SymbolNotAllowedException("duration was over one second, likely invalid, rejecting. index: " + (index+1).toString()+ ", value: "+durationMs.toString());
        }

        vibrationData.add(new VibeProfile(strength, durationMs));
    }

    return vibrationData;
}

function split(s as String, sep as String) as [String] {
    var tokens = [];

    var found = s.find(sep);

    while (found != null) {
        var token = s.substring(0, found);
        tokens.add(token);

        s = s.substring(found + sep.length(), s.length());

        found = s.find(sep);
    }

    tokens.add(s);

    return tokens;
}