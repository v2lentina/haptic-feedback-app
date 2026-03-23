import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.StringUtil;

class GlobalState {
    const bleHandler = new BleHandler();
    var pairingState as PairingState = IDLE;



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
const globalState = GlobalState.getInstance();



class garminApp extends Application.AppBase {
    function initialize() {
        // BluetoothLowEnergy.setDelegate(GlobalState.getInstance().bleHandler);

        AppBase.initialize();
    }

    // Return the initial view of your application here
    function getInitialView() as [Views] or [Views, InputDelegates] {
        var view = new MainView();
        var delegate = new MainDelegate(view);
        return [ view, delegate ];
    }
}

function getApp() as garminApp {
    return Application.getApp() as garminApp;
}







enum PairingState {
    // Neither trying to connect, nor being connected, nor being available to connect
    IDLE,
    // Not connected, but SCANNING for connections
    SCANNING,
    // Connected
    PAIRED_CONNECTED,
    // Paired, but not connected, trying to connect
    PAIRED_TRYINGTOCONNECT,
    // Failure of some sorts
    ERROR
}