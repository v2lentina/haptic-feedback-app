# Haptic Feedback

## Technical setup
### Roles
There are two types of actors: **phone** and **watches**.

#### Watch
**Watch** may be an **Apple watch** or **bangle2.js with custom software**.

As much as support for **Garmin Watches** was anticipated, because of its implementation details, it is impossible for the wanted setup.

#### Phone
There may only be one phone in a given context, but there may be multiple watches.

A **phone** may be an **Android** or **iOS** device.

Depending on the specific **watch**, the **phone** advertises itself or scans for advertising **watches**.
Using the specified proprietary [protocol](./protocol.md#ble-protocol-v1.0).
