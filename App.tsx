import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/Homescreen';
import StopwatchScreen from './screens/Stopwatch';
import Up from './screens/Up';
import UpRd from './screens/UpRd';
import Down from './screens/Down';
import DownRd from './screens/DownRd';
import Interval from './screens/Interval';
import Tabata from './screens/Tabata';
import F9Bad from './screens/F9Bad';
import Amrap from './screens/Amrap';
import Emom from './screens/Emom';
import Beeptest from './screens/Beeptest';
import Custom from './screens/Custom';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
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
                <Stack.Screen name="🏃 Beeptestt" component={Beeptest} />
                <Stack.Screen name="🎛️ Custom" component={Custom} />

            </Stack.Navigator>
        </NavigationContainer>
    );
}
