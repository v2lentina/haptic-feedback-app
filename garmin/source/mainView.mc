import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.BluetoothLowEnergy;
import Toybox.Graphics;


class MainView extends WatchUi.View {
    var pairingState as PairingState = IDLE;

    function initialize() {
        System.println("garminView.initialize");
        View.initialize();
    }

    // Load your resources here
    function onLayout(dc as Dc) as Void {
        setLayout(Rez.Layouts.MainLayout(dc));
    }

    // Update the view
    function onUpdate(dc as Dc) as Void {
        System.println("garminView.onUpdate");

        var drw = self.findDrawableById("pairingStateLabel") as TextArea;
        drw.setText(stringFromPairingState(pairingState));

        // Call the parent onUpdate function to redraw the layout
        View.onUpdate(dc);
    }

    function stringFromPairingState(state as PairingState) as String {
        switch (state) {
            case IDLE:
                return "Press for pair";
            case SCANNING:
                return "Scanning";
            case PAIRED_CONNECTED:
                return "Connected";
            case PAIRED_TRYINGTOCONNECT:
                return "Paired\nConnecting";
            case ERROR:
                return "FAILURE";
            default:
                return "UNKNOWN";
        }
    }
}


class MainDelegate extends WatchUi.BehaviorDelegate {
    var view as MainView;

    var bleHandler as BleHandler;


    function initialize(viewP as MainView) {
        self.view = viewP;

        self.bleHandler = new BleHandler();
        BluetoothLowEnergy.setDelegate(bleHandler);

        BehaviorDelegate.initialize();

    }

    function onSelect() as Boolean {
        System.println("Tapped!");
        self.view.pairingState = SCANNING;

        BluetoothLowEnergy.setScanState(BluetoothLowEnergy.SCAN_STATE_SCANNING);

        requestUpdate();
        return true;
    }
}