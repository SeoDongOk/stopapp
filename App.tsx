import React from 'react';
import 'react-native-gesture-handler';
import {
  NavigationContainer,
  RouteProp,
  ParamListBase,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon: React.FC<{
  routeName: string;
  color: string;
  size: number;
}> = ({routeName, color, size}) => {
  let iconName = '';
  if (routeName === 'Home') iconName = 'home';
  else if (routeName === 'Stats') iconName = 'bar-chart';
  else if (routeName === 'Settings') iconName = 'settings';
  return <Ionicons name={iconName} size={size} color={color} />;
};

function App() {
  return (
    <NavigationContainer
      children={
        <Tab.Navigator
          screenOptions={({
            route,
          }: {
            route: RouteProp<ParamListBase, string>;
          }) => ({
            headerShown: false,
            tabBarIcon: (props: {color: string; size: number}) => (
              <TabBarIcon
                routeName={route.name}
                color={props.color}
                size={props.size}
              />
            ),
          })}>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Stats" component={StatsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      }
    />
  );
}

export default App;
