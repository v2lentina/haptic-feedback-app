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

    function initialize(viewP as MainView) {
        self.view = viewP;

        BehaviorDelegate.initialize();
    }

    function onSelect() as Boolean {
        System.println("Tapped!");
        self.view.pairingState = SCANNING;

        globalState.bleHandler.onScanResult.add(method(:handleScanResult));
        globalState.bleHandler.startScanning();

        requestUpdate();
        return true;
    }

    function handleScanResult(scanResults as Iterator) as Void {
        System.println("Received Scanresults");

        var results = [] as Array<ScanResult>;

        var current = scanResults.next() as ScanResult or Null;
        while(current != null) {
            results.add(current as ScanResult);

            var serviceUuids = current.getServiceUuids();
            var currentServiceUuid = serviceUuids.next() as Uuid or Null;
            while (currentServiceUuid != null) {
                if (currentServiceUuid.equals(globalState.bleHandler.SERVICE_UUID)) {
                    System.println("FOUND THE SERVICE!! on device " + current.getDeviceName());
                }
            }

            current = scanResults.next();
        }
    }
}