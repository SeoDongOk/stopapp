import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  SafeAreaView,
  NativeModules,
  Platform,
  AppState,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {checkUsagePermission} from '../platform/bridge';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

function OnboardingScreen({navigation}: OnboardingScreenProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isNavigating, setIsNavigating] = useState(false);

  const openUsageAccessSettings = () => {
    if (Platform.OS === 'android') {
      try {
        NativeModules.IntentLauncher.startActivity({
          action: 'android.settings.USAGE_ACCESS_SETTINGS',
        });
      } catch (err) {
        console.warn('Failed to open settings:', err);
      }
    } else if (Platform.OS === 'ios') {
      // iOS는 Screen Time 설정 안내
      Alert.alert(
        'Screen Time 권한 필요',
        'iOS에서 사용 시간을 추적하려면 설정에서 Screen Time을 활성화해주세요.',
        [
          {
            text: '설정 열기',
            onPress: () => Linking.openURL('App-Prefs:root=SCREEN_TIME'),
          },
          {text: '취소', style: 'cancel'},
        ],
      );
    }
  };

  const navigateToMainTabs = useCallback(() => {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      setIsNavigating(false);
    }
  }, [navigation, isNavigating]);

  const handleGetStarted = async () => {
    try {
      const hasPermission = await checkUsagePermission();

      if (hasPermission) {
        navigateToMainTabs();
      } else {
        openUsageAccessSettings();
      }
    } catch (e) {
      console.warn('Permission check failed:', e);
      // 권한 체크 실패 시에도 일단 진행 (iOS의 경우)
      if (Platform.OS === 'ios') {
        navigateToMainTabs();
      }
    }
  };

  const checkPermissionAfterSettings = useCallback(async () => {
    try {
      const hasPermission = await checkUsagePermission();

      if (hasPermission) {
        setTimeout(() => {
          navigateToMainTabs();
        }, 100);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
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
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 20,
        }}>
        디지털 웰빙
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#ccc',
          marginBottom: 40,
          textAlign: 'center',
          paddingHorizontal: 40,
        }}>
        앱 사용 시간을 추적하여{'\n'}더 건강한 디지털 습관을 만들어보세요
      </Text>
      <TouchableOpacity
        onPress={handleGetStarted}
        disabled={isNavigating}
        style={{
          padding: 20,
          backgroundColor: isNavigating ? '#ccc' : 'orange',
          borderRadius: 10,
          minWidth: 200,
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#000'}}>
          {isNavigating ? '로딩 중...' : '시작하기'}
        </Text>
      </TouchableOpacity>
      {Platform.OS === 'android' && (
        <Text
          style={{
            fontSize: 12,
            color: '#888',
            marginTop: 20,
            textAlign: 'center',
            paddingHorizontal: 40,
          }}>
          * 사용 접근 권한이 필요합니다
        </Text>
      )}
      {Platform.OS === 'ios' && (
        <Text
          style={{
            fontSize: 12,
            color: '#888',
            marginTop: 20,
            textAlign: 'center',
            paddingHorizontal: 40,
          }}>
          * Screen Time 권한이 필요합니다
        </Text>
      )}
    </SafeAreaView>
  );
}

export default OnboardingScreen;
