import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  SafeAreaView,
  AppState,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  checkAllPermissions,
  requestDrawOverlayPermission,
  requestSleepPermission,
  requestAccessibilityPermission,
  requestNotificationPermission,
  type PermissionStatus,
} from '../platform/bridge';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

function OnboardingScreen({navigation}: OnboardingScreenProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isNavigating, setIsNavigating] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    drawOverlay: false,
    notification: false,
    sleep: false,
    accessibility: false,
  });

  // 모든 권한 확인
  const checkPermissions = useCallback(async () => {
    try {
      const perms = await checkAllPermissions();
      setPermissions(perms);
      console.log('✅ Permissions checked:', perms);
    } catch (error) {
      console.error('❌ Permission check error:', error);
    }
  }, []);

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

  const openDrawOverlaySettings = async () => {
    try {
      await requestDrawOverlayPermission();
    } catch (err) {
      console.warn('Failed to request overlay permission:', err);
    }
  };
  const openNotificationSettings = async () => {
    try {
      await requestNotificationPermission();
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
    }
  };

  const openSleepSettings = async () => {
    try {
      await requestSleepPermission();
    } catch (err) {
      console.warn('Failed to request sleep permission:', err);
    }
  };

  const openAccessibilitySettings = async () => {
    try {
      await requestAccessibilityPermission();
    } catch (err) {
      console.warn('Failed to request accessibility permission:', err);
    }
  };

  const handleGetStarted = async () => {
    try {
      // 권한 다시 확인
      await checkPermissions();

      const allGranted =
        permissions.drawOverlay &&
        permissions.notification &&
        permissions.sleep;

      if (allGranted) {
        console.log('✅ All permissions granted, navigating to MainTabs');
        navigateToMainTabs();
      } else {
        console.log('❌ Some permissions denied, showing alert');

        const missingPermissions = [];
        if (!permissions.drawOverlay)
          missingPermissions.push('• 다른 앱 위에 표시');
        if (!permissions.notification) missingPermissions.push('• 알림 게시');
        if (!permissions.sleep) missingPermissions.push('• 수면 감지');

        Alert.alert(
          '권한이 필요합니다',
          `다음 권한을 활성화해주세요:\n\n${missingPermissions.join('\n')}`,
          [
            // {
            //   text: '다른 앱 위에 표시',
            //   onPress: openDrawOverlaySettings,
            // },
            // {
            //   text: '수면 감지',
            //   onPress: openSleepSettings,
            // },
            // {
            //   text: '접근성 서비스',
            //   onPress: openAccessibilitySettings,
            // },
            {
              text: '나중에',
              style: 'cancel',
              onPress: () => {
                navigateToMainTabs();
              },
            },
          ],
        );
      }
    } catch (e) {
      console.warn('Permission check failed:', e);
      navigateToMainTabs();
    }
  };

  const checkPermissionAfterSettings = useCallback(async () => {
    try {
      console.log('🔄 Checking permissions after returning from settings...');
      await checkPermissions();
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, [checkPermissions]);

  // 앱 포커스시 권한 확인
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

  // 초기 권한 확인
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#000',
      }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
        <Text
          style={{
            fontSize: 28,
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
          }}>
          앱 사용 시간을 추적하여{'\n'}더 건강한 디지털 습관을 만들어보세요
        </Text>

        {/* 권한 상태 표시 */}
        <Text
          style={{
            fontSize: 14,
            color: '#fff',
            marginBottom: 15,
            fontWeight: '600',
          }}>
          필요한 권한:
        </Text>

        <TouchableOpacity
          onPress={openDrawOverlaySettings}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            backgroundColor: permissions.drawOverlay ? '#2d5f2e' : '#4a4a4a',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: permissions.drawOverlay ? '#90EE90' : '#fff',
              fontSize: 12,
              marginRight: 10,
            }}>
            {permissions.drawOverlay ? '✅' : '○'}
          </Text>
          <Text
            style={{
              color: permissions.drawOverlay ? '#90EE90' : '#ccc',
              fontSize: 14,
              flex: 1,
            }}>
            다른 앱 위에 표시
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openNotificationSettings}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            backgroundColor: permissions.notification ? '#2d5f2e' : '#4a4a4a',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: permissions.notification ? '#90EE90' : '#fff',
              fontSize: 12,
              marginRight: 10,
            }}>
            {permissions.notification ? '✅' : '○'}
          </Text>
          <Text
            style={{
              color: permissions.notification ? '#90EE90' : '#ccc',
              fontSize: 14,
              flex: 1,
            }}>
            알림 게시
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openSleepSettings}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 10,
            backgroundColor: permissions.sleep ? '#2d5f2e' : '#4a4a4a',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: permissions.sleep ? '#90EE90' : '#fff',
              fontSize: 12,
              marginRight: 10,
            }}>
            {permissions.sleep ? '✅' : '○'}
          </Text>
          <Text
            style={{
              color: permissions.sleep ? '#90EE90' : '#ccc',
              fontSize: 14,
              flex: 1,
            }}>
            수면 감지
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openAccessibilitySettings}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 30,
            backgroundColor: permissions.accessibility ? '#2d5f2e' : '#4a4a4a',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: permissions.accessibility ? '#90EE90' : '#fff',
              fontSize: 12,
              marginRight: 10,
            }}>
            {permissions.accessibility ? '✅' : '○'}
          </Text>
          <Text
            style={{
              color: permissions.accessibility ? '#90EE90' : '#ccc',
              fontSize: 14,
              flex: 1,
            }}>
            접근성 서비스
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGetStarted}
          disabled={isNavigating}
          style={{
            width: '100%',
            padding: 16,
            backgroundColor: isNavigating ? '#ccc' : '#ff9500',
            borderRadius: 10,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: '#000'}}>
            {isNavigating ? '로딩 중...' : '시작하기'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default OnboardingScreen;
