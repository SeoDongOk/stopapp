import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {SafeAreaView, View, Text, Button} from 'react-native';

// 스택 내 라우트 이름 정의
type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Settings: undefined;
};

// HomeScreen의 navigation prop 타입
type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  return (
    <SafeAreaView
      style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View>
        <Text style={{fontSize: 24, marginBottom: 20}}>Home Screen</Text>
        <Button
          title="Go to Settings"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
