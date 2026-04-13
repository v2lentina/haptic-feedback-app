import Toybox.Lang; // yo let's import the language we are talking RIGHT NOW ?! XD (I'm still at the point where I think it's funny)
import Toybox.BluetoothLowEnergy;

class GlobalState {
    const bleHandler = new BleHandler();
    var pairingState as PairingState = IDLE;

    function hasFoundDevices() as Boolean {
        return foundDevices != null && foundDevices.size() != 0;
    }
    var foundDevices as Array<ScanResult> or Null;

    var characteristic as Characteristic or Null;

// Singleton
    // cannot use constructed object, as it doesn't allow for Method/Function properties
    private static var instance as GlobalState or Null;
    private function initialize() {

    }
    static function getInstance() as GlobalState {
        if (instance == null) {
             instance = new GlobalState();
        }
        return instance;
    }
}