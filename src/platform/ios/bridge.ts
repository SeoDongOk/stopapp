import {Platform, NativeModules} from 'react-native';

export interface UsageData {
  packageName: string;
  appName: string;
  iconBase64?: string;
  hours: number;
  date: string;
}

export const getUsageData = async (): Promise<UsageData[]> => {
  if (Platform.OS === 'android') {
    const {UsageStatsBridge} = NativeModules;
    if (!UsageStatsBridge) {
      throw new Error('UsageStatsBridge module not found');
    }
    return UsageStatsBridge.getUsageData();
  }

  // iOS는 데이터 접근 불가
  return [];
};

export const checkUsagePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const {UsageStatsBridge} = NativeModules;
    if (!UsageStatsBridge) {
      return false;
    }
    return UsageStatsBridge.checkPermission();
  }

  // iOS는 항상 true 반환 (Screen Time 직접 체크 불가)
  return true;
};

export const requestUsagePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Android는 Intent로 설정 화면 열기
    return false;
  }

  // iOS는 권한 요청 불필요
  return true;
};
