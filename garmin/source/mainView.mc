import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.BluetoothLowEnergy;
import Toybox.Graphics;
import Toybox.Time.Gregorian;


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
        if (globalState().hasFoundDevices()) {
            var str = "";

            for (var index = 0; index < (globalState().foundDevices as Array<ScanResult>).size(); index++) {
                str += (globalState().foundDevices as Array<ScanResult>)[index].getDeviceName();
                str += " _ ";
            }

            drw.setText(str);
        } else {
            drw.setText(stringFromPairingState(pairingState));
        }


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
    var gs as GlobalState;

    function initialize(viewP as MainView) {
        self.view = viewP;
        self.gs = globalState();

        BehaviorDelegate.initialize();
    }

    function onSelect() as Boolean {
        System.println("Tapped!");

        if (gs.pairingState == SCANNING) {
            return true;
        }

        self.view.pairingState = SCANNING;

        self.gs.bleHandler.onScanResult.add(method(:handleScanResult));
        self.gs.bleHandler.startScanning();

        requestUpdate();
        return true;
    }

    function handleScanResult(scanResults as Iterator) as Void {
        self.gs.foundDevices = [] as Array<ScanResult>;
        System.println("Received Scanresults");

        var results = [] as Array<ScanResult>;

        for (var current = scanResults.next(); current != null; current = scanResults.next()) {
            current= current as ScanResult; // can never be null, as it wouldn't enter the loop then

            results.add(current);
            System.println(Time.now().value() + "| current: " + current.getDeviceName());
            // var manIter = current.getManufacturerSpecificDataIterator();
            // for (var cMan = manIter.next(); cMan != null; cMan = manIter.next()) {
            //     cMan = cMan as Dictionary; // cannot be null, as it wouldn't enter the loop
            //     var manId = cMan.get(:companyId) as Number;
            //     System.println("    current.company: " + manId.format("%X"));
            // }

            var rawData = current.getRawData();
            if (rawData != null) {
                var hexString = "";
                for (var i = 0; i < rawData.size(); i++) {
                    hexString += rawData[i].format("%02X") + " ";
                }
                System.println("Payload: " + hexString);
            }

            // Logic to check for 0xFFFF manually in the byte stream
            if (containsCompanyCode(rawData)) {
                System.println("MATCH FOUND: 0xFFFF detected in raw bytes.");
                (self.gs.foundDevices as Array<ScanResult>).add(current);
            }

            var isFromFFFF = current.getManufacturerSpecificData(0xFFFF) != null;
            System.println("    current is 0xFFFF:" + isFromFFFF);
            if (isFromFFFF) {
                (self.gs.foundDevices as Array<ScanResult>).add(current);
            }

            System.println("    current.rssi: " + current.getRssi());


            // var serviceUuids = current.getServiceUuids();
        //     for (var uuid = serviceUuids.next(); uuid != null; uuid = serviceUuids.next()) {
        //         System.println("        current UUIDs: " + uuid);
        //         if (uuid.equals(self.gs.bleHandler.SERVICE_UUID)) {
        //             System.println("            FOUND THE SERVICE!! on device " + current.getDeviceName());

        //             (self.gs.foundDevices as Array<ScanResult>).add(current);
        //             requestUpdate();
        //         }
        //     }
        }

        System.println("Finished processing ScanResults, got " + results.size());

        // self.gs.foundDevices = results;
        requestUpdate();
    }

    // Manual byte-search for the Company ID (Little Endian: FF FF)
    function containsCompanyCode(data as ByteArray) as Boolean{
        if (data == null || data.size() < 4) { return false; }
        for (var i = 0; i < data.size() - 2; i++) {
            // Manufacturer data blocks usually start with [Length][0xFF][LowByte][HighByte]
            if (data[i] == 0xFF && data[i+1] == 0xFF && data[i+2] == 0xFF) {
                return true;
            }
        }
        return false;
    }
}