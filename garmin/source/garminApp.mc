import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.StringUtil;

class garminApp extends Application.AppBase {
    function initialize() {
        AppBase.initialize();
    }

    // Return the initial view of your application here
    function getInitialView() as [Views] or [Views, InputDelegates] {
        var view = new garminView();
        var delegate = new garminDelegate(view);
        return [ view, delegate ];
    }
}

function getApp() as garminApp {
    return Application.getApp() as garminApp;
}