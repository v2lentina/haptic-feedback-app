# Technical Documentation

## Vibration patterns
> To see all available vibration patterns see [`vibrationPatterns.ts`](./vibrationPatterns.ts).

Values are like [Garmin](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html) uses.

<!-- add handshake message -->

# Protocol v1.0
```
<MESSAGE> ::= <VIBRATIONMESSAGE> | <OTHERMESSAGE>

<VIBRATIONMESSAGE> ::= "VIBRATION,"<VIBRATIONBODY>

<VIBRATIONBODY> ::= "[" <VIBRATIONDEFINITION> "]"

<VIBRATIONDEFINITION> ::= <DUTYCYCLE>","<DURATION_MS>
	| <DUTYCYCLE>","<DURATION_MS>","<VIBRATIONDEFINITION>

<OTHERMESSAGE> ::= "OTHER,"<BODY>

<BODY> ::= string()

<DUTYCYCLE> ::= float(0..100)

<DURATION_MS> ::= int(0..2000)
```

One can also think of it in terms of
```
<MESSAGE> ::= <TYPE>","<BODY>

<TYPE> ::= "VIBRATION" | "OTHER"
<BODY> ::= <VIBRATIONBODY> | string()
```