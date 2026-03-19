import Toybox.BluetoothLowEnergy;

class BleHandler extends BleDelegate {
	var lastScanresults as Iterator or Null;

	function initialize() {
		BleDelegate.initialize();
	}

	function onScanResults(scanResults as Iterator) as Void {
		lastScanresults = scanResults;
	}
}