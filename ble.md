# BLE

## GATT & BLE Structure
BLE is structured. Similar to the IP/MAC protocols in networking, BLE needs some form of addressing.

BLE has MAC/Hardware addresses as well, but similar to the network one usually doesn't directly use them.
Instead BLE uses UUIDs.

BLE has a two level structure: a device can have multiple *services* and every service can have multiple *characteristics*.

Just like the gateway of a subnet before NAT, every service is uniquely identifyable, even so the *characteristic* is as well.

Notice how the device itself *does not* have an identifier of its own. 
> It has its name but that is not intended to be unique, since every device can arbitrarily change its name. In fact it is a major security flaw, if you identify deviced via this name only. **BLE does not provide an authentication mechanism.**

> Important to note: even though technically possible, a characteristic's UUID has to be, well, unique, ie. if you want two services to host the same characteristic it possible to assign them the same UUID, but they would not be connected in any way. If anything some libraries could have problems disecting which characteristic is addressed.

This structure is called *GATT*, and needs to be defined by the [*peripheral*](#peripheral) device.

### How to read/write
A **characteristic is the source and/or sink to read/write from/to**. To define what should be possible there are *flags* that indicate read/write/notify with/without acknowledge response etc.

## BLE Modes
BLE has two modes:
* Peripheral and
* Central

Two devices must have opposite modes in order for them to be able to communicate.

### Peripheral
As the name suggests designed for external devices (relative to the central one) that **support data** (ie. producer role in producer-consumer-pattern).

They can publish data asynchronosly while the connected device can check on those values whenever they want.

They can only connect to *one* device at a time.

### Central
Again as the name suggests, this is the central point to which *multiple* devices can be connected.

They are responsible to search for appropriate peripherals and request connection. After which they are able to [communicate via the GATT structure](#how-to-readwrite).
