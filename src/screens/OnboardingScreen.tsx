import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  SafeAreaView,
  NativeModules,
  Platform,
  AppState,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

function OnboardingScreen({navigation}: OnboardingScreenProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {}, [navigation]);

  const openUsageAccessSettings = () => {
    if (Platform.OS === 'android') {
      try {
        NativeModules.IntentLauncher.startActivity({
          action: 'android.settings.USAGE_ACCESS_SETTINGS',
        });
      } catch (err) {
        console.warn('Failed to open settings:', err);
      }
    }
  };

  const navigateToMainTabs = useCallback(() => {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      // 방법 1: reset 사용 (권장)
      navigation.replace('MainTabs');
      // navigation.reset({
      //   index: 0,
      //   routes: [{name: 'MainTabs'}],
      // });
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      setIsNavigating(false);
    }
  }, [navigation, isNavigating]);

  const handleGetStarted = async () => {
    if (Platform.OS === 'android' && NativeModules.UsageStatsBridge) {
      try {
        const hasPermission =
          await NativeModules.UsageStatsBridge.checkPermission();

        if (hasPermission) {
          navigateToMainTabs();
        } else {
          openUsageAccessSettings();
        }
      } catch (e) {
        console.warn('Permission check failed:', e);
      }
    } else {
      navigateToMainTabs();
    }
  };

  const checkPermissionAfterSettings = useCallback(async () => {
    if (Platform.OS === 'android' && NativeModules.UsageStatsBridge) {
      try {
        const hasPermission =
          await NativeModules.UsageStatsBridge.checkPermission();

        if (hasPermission) {
          // 짧은 지연 후 네비게이션 (상태 업데이트 대기)
          setTimeout(() => {
            navigateToMainTabs();
          }, 100);
        } else {
        }
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    }
  }, [navigateToMainTabs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        checkPermissionAfterSettings();
      }

      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, checkPermissionAfterSettings]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}>
      <TouchableOpacity
        onPress={handleGetStarted}
        disabled={isNavigating}
        style={{
          padding: 20,
          backgroundColor: isNavigating ? '#ccc' : 'orange',
          borderRadius: 10,
        }}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>
          {isNavigating ? 'Loading...' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default OnboardingScreen;
