import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.BluetoothLowEnergy;

class garminDelegate extends WatchUi.BehaviorDelegate {
    var view as garminView;

    var bleHandler as BleHandler;


    function initialize(viewP as garminView) {
        self.view = viewP;

        self.bleHandler = new BleHandler();
        BluetoothLowEnergy.setDelegate(bleHandler);

        BehaviorDelegate.initialize();

    }

    function onSelect() as Boolean {
        System.println("Tapped!");
        self.view.pairingState = DISCOVERABLE_PAIRING;

        BluetoothLowEnergy.setScanState(BluetoothLowEnergy.SCAN_STATE_SCANNING);

        requestUpdate();
        return true;
    }
}