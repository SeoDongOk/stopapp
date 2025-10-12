import {NativeModules} from 'react-native';
const {UsageStatsBridge} = NativeModules;

export async function getUsageData() {
  try {
    const data = await UsageStatsBridge.getUsageData();
    return data;
  } catch (err) {
    console.warn(err);
    return null;
  }
}
