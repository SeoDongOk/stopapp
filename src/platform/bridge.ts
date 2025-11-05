import {Platform} from 'react-native';
import {getUsageData as getAndroidUsageData} from './android/bridge';
import {
  getIOSUsageData,
  requestScreenTimePermission,
  checkScreenTimePermission,
} from './ios/bridge';

export interface UsageData {
  packageName: string;
  appName: string;
  iconBase64?: string;
  hours: number;
  date: string;
}

export const getUsageData = async (): Promise<UsageData[]> => {
  if (Platform.OS === 'android') {
    return getAndroidUsageData();
  } else if (Platform.OS === 'ios') {
    return getIOSUsageData();
  }
  return [];
};

export const requestUsagePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Android는 Intent로 설정 화면 열기
    return false; // Intent 열기는 별도 처리
  } else if (Platform.OS === 'ios') {
    return requestScreenTimePermission();
  }
  return false;
};

export const checkUsagePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const {UsageStatsBridge} = require('react-native').NativeModules;
    return UsageStatsBridge.checkPermission();
  } else if (Platform.OS === 'ios') {
    return checkScreenTimePermission();
  }
  return false;
};
