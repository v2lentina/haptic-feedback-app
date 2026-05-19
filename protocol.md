
# BLE Protocol v1.0

This is the communication protocol used for communication between the [phone](./readme.md#phone) and [watches](./readme.md#watch).

It is a plain-text (JSON) protocol transmitted via BLE messages.

<!-- JSON version -->
```
{
	"type": "VIBRATION" | "HANDSHAKE" | "OTHER",
	"body": [
		DUTYCYCLE, DURATION,
		DUTYCYCLE, DURATION,
		DUTYCYCLE, DURATION,
	] | String | String(ID of Device),
}
```


<!-- add handshake message -->
## Technically accurate

> Also see [human version](#for-human-thinking)

```
<MESSAGE> ::= <VIBRATIONMESSAGE> | <OTHERMESSAGE> | <HANDSHAKEMESSAGE>

<VIBRATIONMESSAGE> ::= "VIBRATION,"<VIBRATIONBODY>

<VIBRATIONBODY> ::= "[" <VIBRATIONDEFINITION> "]"

<VIBRATIONDEFINITION> ::= <DUTYCYCLE>","<DURATION_MS>
	| <DUTYCYCLE>","<DURATION_MS>","<VIBRATIONDEFINITION>

<OTHERMESSAGE> ::= "OTHER,"<BODY>

<BODY> ::= string()

<DUTYCYCLE> ::= float(0..100)

<DURATION_MS> ::= int(0..2000)

<HANDSHAKEMESSAGE> ::= "HANDSHAKE,<ID>"
```

## For human thinking

One can also think of it in terms of
```
<MESSAGE> ::= <TYPE>","<BODY>

<TYPE> ::= "VIBRATION" | "OTHER"
<BODY> ::= <VIBRATIONBODY> | string()
```

**VibrationBody** is simply defined as [Garmin](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html) uses:

```json
[
	DUTYCYCLE, DURATION,
	DUTYCYCLE, DURATION,
	DUTYCYCLE, DURATION,
	// ...
]
```

> To see all available vibration patterns see [`vibrationPatterns.ts`](./HapticFeedbackApp/vibrationPatterns.ts).
