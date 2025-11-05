import React from 'react';
import 'react-native-gesture-handler';
import {
  NavigationContainer,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
// import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabBarIcon: React.FC<{
  routeName: string;
  color: string;
  size: number;
}> = ({routeName, color, size}) => {
  let iconName = 'apps'; // 기본 아이콘 설정 (중요!)

  // 한글 이름에 맞게 수정
  if (routeName === '습관') {
    iconName = 'home';
  } else if (routeName === '통계') {
    iconName = 'bar-chart';
  } else if (routeName === '설정') {
    iconName = 'settings';
  }

  console.log('TabBarIcon - routeName:', routeName, 'iconName:', iconName);

  return <Ionicons name={iconName} size={size} color={color} />;
};

const MainTabs = () => {
  console.log('MainTabs component rendered');

  return (
    <Tab.Navigator
      screenOptions={({route}: {route: RouteProp<ParamListBase, string>}) => ({
        headerShown: false,
        lazy: false,
        tabBarIcon: (props: {color: string; size: number}) => (
          <TabBarIcon
            routeName={route.name}
            color={props.color}
            size={props.size}
          />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="습관" component={HomeScreen} />
      <Tab.Screen name="통계" component={StatsScreen} />
      {/* <Tab.Screen name="설정" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
};

function App() {
  return (
    <NavigationContainer
      onStateChange={state => {
        console.log(
          '🔄 Navigation state changed:',
          JSON.stringify(state, null, 2),
        );
      }}
      onReady={() => {
        console.log('✅ Navigation ready');
      }}>
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
