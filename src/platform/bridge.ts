import {Platform} from 'react-native';
import {
  getUsageData as getAndroidUsageData,
  checkAllPermissions as checkAndroidPermissions,
  requestDrawOverlayPermission as requestAndroidOverlay,
  requestNotificationPermission as requestAndroidNotification,
  requestSleepPermission as requestAndroidSleep,
  checkAndroidAccessibility,
  requestAndroidAccessibility,
} from './android/bridge';
import {
  getIOSUsageData,
  checkIOSPermissions,
  requestIOSPermissions,
} from './ios/bridge';

export interface UsageData {
  packageName: string;
  appName: string;
  iconBase64?: string;
  hours: number;
  date: string;
}

export interface PermissionStatus {
  drawOverlay: boolean;
  notification: boolean;
  sleep: boolean;
  accessibility: boolean;
}

// ===== 사용 데이터 조회 =====
export const getUsageData = async (): Promise<UsageData[]> => {
  if (Platform.OS === 'android') {
    return getAndroidUsageData();
  } else if (Platform.OS === 'ios') {
    return getIOSUsageData();
  }
  return [];
};

// ===== 모든 권한 확인 =====
export const checkAllPermissions = async (): Promise<PermissionStatus> => {
  if (Platform.OS === 'android') {
    return checkAndroidPermissions();
  } else if (Platform.OS === 'ios') {
    return checkIOSPermissions();
  }
  return {
    drawOverlay: false,
    notification: false,
    sleep: false,
    accessibility: false,
  };
};

// ===== 오버레이 권한 요청 =====
export const requestDrawOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return requestAndroidOverlay();
  } else if (Platform.OS === 'ios') {
    return requestIOSPermissions().then(perms => perms.drawOverlay);
  }
  return false;
};

// ===== 알림 권한 요청 =====
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return requestAndroidNotification();
  } else if (Platform.OS === 'ios') {
    return requestIOSPermissions().then(perms => perms.notification);
  }
  return false;
};

// ===== 수면 감지 권한 요청 =====
export const requestSleepPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return requestAndroidSleep();
  } else if (Platform.OS === 'ios') {
    return requestIOSPermissions().then(perms => perms.sleep);
  }
  return false;
};

// ===== 접근성 서비스 권한 확인 =====
export const checkAccessibilityPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return checkAndroidAccessibility();
  }
  return false;
};

// ===== 접근성 서비스 권한 요청 =====
export const requestAccessibilityPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return requestAndroidAccessibility();
  }
  return false;
};
