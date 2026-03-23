import Toybox.BluetoothLowEnergy;
import Toybox.Lang;

// extends BleDelegate causes the simulator to crash (yes crash, not even that it doesn't do anything, it straight up causes a segfault...)
class BleHandler extends BleDelegate {
	var lastScanresults as Iterator or Null;

	var connectedDevice as Device or Null;

	var onScanResult as Array<Method> = [];
	var onConnected as Array<Method> = [];
	var onDisconnected as Array<Method> = [];

	const SERVICE_UUID = Toybox.BluetoothLowEnergy.stringToUuid("66b869a0-88cc-4ce9-9ac9-159e69089880");

	const profile = {
			:uuid => self.SERVICE_UUID,
			:characteristics => [
					{
							:uuid => self.SERVICE_UUID,
							:descriptors => [ BluetoothLowEnergy.cccdUuid() ]
					}
			]
	};

	function initialize() {
    registerProfile(profile);
		BleDelegate.initialize();

		BluetoothLowEnergy.setDelegate(self);
	}

	function startScanning() as Void {
		BluetoothLowEnergy.setScanState(BluetoothLowEnergy.SCAN_STATE_SCANNING);
		GlobalState.getInstance().pairingState = SCANNING;
	}

	function abortScanning() as Void {
		BluetoothLowEnergy.setScanState(BluetoothLowEnergy.SCAN_STATE_OFF);
		GlobalState.getInstance().pairingState = IDLE;
	}

	function onScanResults(scanResults as Iterator) as Void {
		lastScanresults = scanResults;

		for (var index = 0; index < onScanResult.size(); index++) {
			self.onScanResult[index].invoke(lastScanresults);
		}
	}

	function onConnectedStateChanged(device as Device, state as ConnectionState) as Void {
		if (state == CONNECTION_STATE_CONNECTED) {
			connectedDevice = device;
			for(var index = 0; index < self.onConnected.size(); index++) {
				self.onConnected[index].invoke(connectedDevice);
			}
		} else {
			connectedDevice = null;
			for(var index = 0; index < self.onDisconnected.size(); index++) {
				self.onDisconnected[index].invoke(device);
			}
		}
	}

	function disconnect() as Void {
		// TODO: how to disconnect a connection properly? https://developer.garmin.com/connect-iq/api-docs/Toybox/BluetoothLowEnergy.html
	}
}