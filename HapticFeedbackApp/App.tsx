import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BleProvider } from './BleContext.tsx';
import Amrap from './screens/Amrap.tsx';
import Beeptest from './screens/Beeptest.tsx';
import Custom from './screens/Custom.tsx';
import Down from './screens/Down.tsx';
import DownRd from './screens/DownRd.tsx';
import Emom from './screens/Emom.tsx';
import F9Bad from './screens/F9Bad.tsx';
import HomeScreen from './screens/Homescreen.tsx';
import Interval from './screens/Interval.tsx';
import StopwatchScreen from './screens/Stopwatch.tsx';
import Tabata from './screens/Tabata.tsx';
import Up from './screens/Up.tsx';
import UpRd from './screens/UpRd.tsx';

const Stack = createNativeStackNavigator();

export const screens = [
    { label: "Home", component: HomeScreen },
    { label: "⏱ Stoppuhr", component: StopwatchScreen },
    { label: "🔄 Interval", component: Interval },
    { label: "⬆️ Hochzählen", component: Up },
    { label: "🔃 Hoch in Runden", component: UpRd },
    { label: "⬇️ Runterzählen", component: Down },
    { label: "🔃 Runter in Runden", component: DownRd },
    { label: "🧨 Tabata", component: Tabata },
    { label: "🥊 F9Bad", component: F9Bad },
    { label: "🔥 Amrap", component: Amrap },
    { label: "⏰ Emom", component: Emom },
    { label: "🏃 Beeptest", component: Beeptest },
    { label: "🎛️ Custom", component: Custom },
]

export default function App() {
    return (
        <BleProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    {screens.map(def => <Stack.Screen name={def.label} component={def.component} />)}
                </Stack.Navigator>
            </NavigationContainer>
        </BleProvider>
    );
}
