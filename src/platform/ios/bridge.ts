import {NativeModules} from 'react-native';
import {UsageData, PermissionStatus} from '../bridge';

const {HealthKit} = NativeModules;

export async function getIOSUsageData(): Promise<UsageData[]> {
  try {
    // iOS에서는 HealthKit이나 다른 방식으로 데이터 수집
    // 현재는 placeholder
    return [];
  } catch (err) {
    console.warn('iOS UsageData Error:', err);
    return [];
  }
}

export async function checkIOSPermissions(): Promise<PermissionStatus> {
  try {
    // iOS는 Android와 다른 권한 시스템 사용
    // HealthKit, NotificationCenter 등의 권한을 확인

    // Placeholder: 모두 false로 반환 (나중에 구현)
    return {
      drawOverlay: false,
      notification: false,
      sleep: false,
    };
  } catch (err) {
    console.warn('iOS Permission check error:', err);
    return {
      drawOverlay: false,
      notification: false,
      sleep: false,
    };
  }
}

export async function requestIOSPermissions(): Promise<PermissionStatus> {
  try {
    // iOS 권한 요청 로직
    // Placeholder: 모두 false로 반환 (나중에 구현)
    return {
      drawOverlay: false,
      notification: false,
      sleep: false,
    };
  } catch (err) {
    console.warn('iOS Permission request error:', err);
    return {
      drawOverlay: false,
      notification: false,
      sleep: false,
    };
  }
}
