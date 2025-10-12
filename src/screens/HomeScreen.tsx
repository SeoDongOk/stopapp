import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  Platform,
  NativeModules,
  ScrollView,
} from 'react-native';
import {getUsageData} from '../platform/android/bridge';

// 스택 내 라우트 이름 정의
type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Settings: undefined;
};

// HomeScreen의 navigation prop 타입
type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};
const toHMString = (hoursDecimal: number) => {
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return {h, m, hm: `${h}시간 ${String(m).padStart(2, '0')}분`, totalMinutes};
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [usageList, setUsageList] = useState<any[] | null>(null);
  // const [permissionDenied, setPermissionDenied] = useState(false);

  const openUsageAccessSettings = () => {
    if (Platform.OS === 'android') {
      try {
        const pkg =
          NativeModules.PlatformConstants?.getConstants?.().BundleIdentifier ??
          'com.stopapp';
        NativeModules.IntentLauncher.startActivity({
          action: 'android.settings.USAGE_ACCESS_SETTINGS',
          data: `package:${pkg}`,
        });
      } catch (err) {
        console.warn('Cannot open app settings directly:', err);
        NativeModules.IntentLauncher.startActivity({
          action: 'android.settings.USAGE_ACCESS_SETTINGS',
        });
      }
    }
  };

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await getUsageData(); // ✅ 이제 배열로 들어옴
        console.log(data);
        const transformed = data
          .map((it: any) => {
            const t = toHMString(it.hours);
            return {...it, ...t}; // packageName, hours, h, m, hm, totalMinutes
          })
          .sort((a: any, b: any) => b.totalMinutes - a.totalMinutes);

        setUsageList(transformed); // data = [{packageName: "...", hours: 1.23}, ...]
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsage();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
      }}>
      <Text style={{fontSize: 24, marginBottom: 10}}>Home Screen</Text>

      {usageList === null ? (
        <>
          <Text>📱 사용 접근 권한이 필요합니다.</Text>
          <Button title="권한 설정 열기" onPress={openUsageAccessSettings} />
        </>
      ) : usageList === null ? (
        <>
          <Text>Loading...</Text>
          <View style={{marginTop: 16}}>
            <Button title="앱 설정 열기" onPress={openUsageAccessSettings} />
          </View>
        </>
      ) : (
        <ScrollView style={{width: '100%'}}>
          {usageList.map((item, index) => (
            <Text key={index} style={{marginVertical: 4, color: '#fff'}}>
              {item.packageName}, {item.appName}: {item.hm}
            </Text>
          ))}
        </ScrollView>
      )}

      <Button
        title="Go to Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
