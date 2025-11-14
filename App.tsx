import React from 'react';
import 'react-native-gesture-handler';
import {
  NavigationContainer,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Image} from 'react-native'; // 이 줄 추가!

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import TimelineScreen from './src/screens/TimeLineScreen';
// import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const stackActive = require('./src/assets/active_stack.png');
const stackUnactive = require('./src/assets/unactive_stack.png');
const graphActive = require('./src/assets/active_grahp.png');
const graphUnactive = require('./src/assets/unactive_grahp.png');

const TabBarIcon: React.FC<{
  routeName: string;
  focused: boolean;
  size: number;
}> = ({routeName, focused, size}) => {
  // 모든 탭에 stack 아이콘 사용 (active/unactive만 구분)
  if (routeName === '통계') {
    const iconSource = focused ? graphActive : graphUnactive;
    return (
      <Image
        source={iconSource}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
    );
  } else {
    const iconSource = focused ? stackActive : stackUnactive;

    return (
      <Image
        source={iconSource}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
    );
  }
};

const MainTabs = () => {
  console.log('MainTabs component rendered');

  return (
    <Tab.Navigator
      screenOptions={({route}: {route: RouteProp<ParamListBase, string>}) => ({
        headerShown: false,
        lazy: false,
        tabBarIcon: (props: {
          color: string;
          size: number;
          focused: boolean;
        }) => (
          <TabBarIcon
            routeName={route.name}
            focused={props.focused}
            size={props.size}
          />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="습관" component={HomeScreen} />
      <Tab.Screen name="타임라인" component={TimelineScreen} />
      <Tab.Screen name="통계" component={StatsScreen} />
      {/* <Tab.Screen name="설정" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
};

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="Onboarding">
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            gestureEnabled: false, // 뒤로가기 제스처 비활성화
          }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            gestureEnabled: false, // 뒤로가기 제스처 비활성화
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
