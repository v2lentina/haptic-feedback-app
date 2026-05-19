# Technical Documentation

## BLE
> [An explanation on how BLE works.](../ble.md)

Apple and Garmin Watches only offer central mode, only proprietary prototypes or Android Wear devices can potentially support peripheral mode.
Because of this, both modes of operation are allowed. 

Using BLE as the transport layer the [protocol](../protocol.md) is used.

## Vibration patterns
> To see all available vibration patterns see [`vibrationPatterns.ts`](./vibrationPatterns.ts).

Values are like [Garmin](https://developer.garmin.com/connect-iq/api-docs/Toybox/Attention/VibeProfile.html) uses.