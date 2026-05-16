# Haptic Feedback App

## Development

To start the app:
```sh
npm run andorid
npm run ios
```

### Architecture
[`ble.ts`](./ble.ts) contains the `BleManager`, which provides functionality to advertise and connect BLE-Devices.

It is used by [`BleContext.tsx`](./BleContext.tsx) to utilize these features and provide state for the react-native application.

For more details on the device-roles and message protocol used see [doc.md](./doc.md) and [project readme](../readme.md#roles)
