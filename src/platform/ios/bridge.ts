import {NativeModules, Platform} from 'react-native';

const {ScreenTimeModule} = NativeModules;

export interface UsageData {
  packageName: string;
  appName: string;
  iconBase64?: string;
  hours: number;
  date: string;
}

export const requestScreenTimePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    throw new Error('This function is only available on iOS');
  }

  try {
    return await ScreenTimeModule.requestAuthorization();
  } catch (error) {
    console.error('Failed to request Screen Time permission:', error);
    throw error;
  }
};

export const checkScreenTimePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return await ScreenTimeModule.checkPermission();
  } catch (error) {
    console.error('Failed to check Screen Time permission:', error);
    return false;
  }
};

export const getIOSUsageData = async (): Promise<UsageData[]> => {
  if (Platform.OS !== 'ios') {
    throw new Error('This function is only available on iOS');
  }

  try {
    return await ScreenTimeModule.getUsageData();
  } catch (error) {
    console.error('Failed to get iOS usage data:', error);
    throw error;
  }
};
