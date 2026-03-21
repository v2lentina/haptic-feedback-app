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

export default function App() {
    return (
        <BleProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="⏱ Stoppuhr" component={StopwatchScreen} />
                    <Stack.Screen name="🔄 Interval" component={Interval} />
                    <Stack.Screen name="⬆️ Hochzählen" component={Up} />
                    <Stack.Screen name="🔃 Hoch in Runden" component={UpRd} />
                    <Stack.Screen name="⬇️ Runterzählen" component={Down} />
                    <Stack.Screen name="🔃 Runter in Runden" component={DownRd} />
                    <Stack.Screen name="🧨 Tabata" component={Tabata} />
                    <Stack.Screen name="🥊 F9Bad" component={F9Bad} />
                    <Stack.Screen name="🔥 Amrap" component={Amrap} />
                    <Stack.Screen name="⏰ Emom" component={Emom} />
                    <Stack.Screen name="🏃 Beeptest" component={Beeptest} />
                    <Stack.Screen name="🎛️ Custom" component={Custom} />

                </Stack.Navigator>
            </NavigationContainer>
        </BleProvider>
    );
}
