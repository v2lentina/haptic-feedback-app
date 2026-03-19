import Toybox.Graphics;
import Toybox.WatchUi;
import Toybox.Lang;

enum PairingState {
    // Neither trying to connect, nor being connected, nor being available to connect
    IDLE,
    // Not connected, but available for connection
    DISCOVERABLE_PAIRING,
    // Connected
    PAIRED_CONNECTED,
    // Paired, but not connected, trying to connect
    PAIRED_TRYINGTOCONNECT,
    // Failure of some sorts
    ERROR
}



class garminView extends WatchUi.View {
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
            case DISCOVERABLE_PAIRING:
                return "Waiting for connection";
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
