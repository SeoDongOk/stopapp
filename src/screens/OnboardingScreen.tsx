import React from 'react';
import {Text, Button, SafeAreaView} from 'react-native';

function OnboardingScreen({navigation}: any) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}>
      <Text>Welcome to StopApp 👋</Text>
      <Button title="Get Started" onPress={() => navigation.replace('Home')} />
    </SafeAreaView>
  );
}

export default OnboardingScreen;
