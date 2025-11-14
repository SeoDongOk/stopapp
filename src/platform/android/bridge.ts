import {NativeModules} from 'react-native';

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

const {UsageStatsBridge} = NativeModules;
const {PermissionHelper} = NativeModules;

// 모듈 로드 확인
if (!PermissionHelper) {
  console.error('❌ PermissionHelper module not loaded!');
}
if (!UsageStatsBridge) {
  console.error('❌ UsageStatsBridge module not loaded!');
}

export async function getUsageData(): Promise<UsageData[]> {
  try {
    console.log('🔄 Calling UsageStatsBridge.getUsageData()...');
    console.log('UsageStatsBridge:', UsageStatsBridge);
    console.log('UsageStatsBridge type:', typeof UsageStatsBridge);
    console.log('getUsageData method:', UsageStatsBridge?.getUsageData);

    if (!UsageStatsBridge) {
      console.error('❌ UsageStatsBridge is NULL!');
      return [];
    }

    if (!UsageStatsBridge.getUsageData) {
      console.error('❌ getUsageData method does not exist!');
      return [];
    }

    const rawData = await UsageStatsBridge.getUsageData();
    console.log('📦 Raw data received:', rawData);

    if (!rawData) {
      console.warn('⚠️ rawData is null or undefined');
      return [];
    }

    const today = new Date().toISOString().split('T')[0];

    // Native에서 받은 데이터를 UsageData 형식으로 변환
    const usageDataArray: UsageData[] = rawData.map((item: any) => ({
      packageName: item.packageName || '',
      appName: item.appName || item.packageName || 'Unknown',
      hours: Math.round((item.hours || 0) * 100) / 100,
      date: today,
      iconBase64: item.iconBase64,
    }));

    return usageDataArray.sort((a, b) => b.hours - a.hours);
  } catch (err) {
    console.error('❌ Android UsageData Error:', err);
    return [];
  }
}

// 모든 권한 확인
export async function checkAllPermissions(): Promise<PermissionStatus> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return {
        drawOverlay: false,
        notification: false,
        sleep: false,
        accessibility: false,
      };
    }

    const drawOverlay = await PermissionHelper.checkDrawOverlayPermission();
    const notification = await PermissionHelper.checkNotificationPermission();
    const sleep = await PermissionHelper.checkSleepPermission();
    const accessibility = await PermissionHelper.checkAccessibilityPermission();

    console.log('✅ Permissions:', {
      drawOverlay,
      notification,
      sleep,
      accessibility,
    });

    return {
      drawOverlay,
      notification,
      sleep,
      accessibility,
    };
  } catch (err) {
    console.error('❌ Permission check error:', err);
    return {
      drawOverlay: false,
      notification: false,
      sleep: false,
      accessibility: false,
    };
  }
}

// 알림 권한 요청
// Android: 설정 화면으로 이동하여 사용자가 직접 활성화
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    console.log('🔄 Opening Notification permission settings...');
    await PermissionHelper.requestNotificationPermission();
    return false;
  } catch (err) {
    console.error('❌ Failed to open notification permission settings:', err);
    return false;
  }
}

// 오버레이 권한 요청
// Android: 설정 화면으로 이동하여 사용자가 직접 활성화
export async function requestDrawOverlayPermission(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    console.log('🔄 Opening Draw Overlay permission settings...');
    await PermissionHelper.requestDrawOverlayPermission();
    return false;
  } catch (err) {
    console.error('❌ Failed to open overlay permission settings:', err);
    return false;
  }
}

// 수면 감지 권한 요청
// Android: Samsung Health 앱으로 이동하여 권한 활성화
export async function requestSleepPermission(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    console.log('🔄 Opening Sleep permission settings...');
    await PermissionHelper.requestSleepPermission();
    return false;
  } catch (err) {
    console.error('❌ Failed to open sleep permission settings:', err);
    return false;
  }
}

// 접근성 서비스 권한 확인
export async function checkAndroidAccessibility(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    return await PermissionHelper.checkAccessibilityPermission();
  } catch (err) {
    console.error('❌ Accessibility check error:', err);
    return false;
  }
}

// 접근성 서비스 권한 요청
// Android: 설정 화면으로 이동하여 사용자가 직접 활성화
export async function requestAndroidAccessibility(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    console.log('🔄 Opening Accessibility permission settings...');
    await PermissionHelper.requestAccessibilityPermission();
    return false;
  } catch (err) {
    console.error('❌ Failed to open accessibility permission settings:', err);
    return false;
  }
}
export async function requestSamsungHealthPermission(): Promise<boolean> {
  try {
    if (!PermissionHelper) {
      console.error('❌ PermissionHelper not available');
      return false;
    }
    console.log('🔄 Requesting Samsung Health permission...');
    const result = await PermissionHelper.requestSamsungHealthPermission();
    return result ?? false;
  } catch (err) {
    console.error('❌ Failed to request Samsung Health permission:', err);
    return false;
  }
}
