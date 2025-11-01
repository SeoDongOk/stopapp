import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  Button,
  Platform,
  NativeModules,
  ScrollView,
} from 'react-native';
import {getUsageData} from '../platform/android/bridge';
import {Calendar} from 'react-native-calendars';

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

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [usageList, setUsageList] = useState<any[] | null>(null);
  const [filteredUsageList, setFilteredUsageList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

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

  useEffect(() => {
    if (usageList) {
      const filtered = usageList.filter(it => {
        if (!it.date) return false;

        // Sat Oct 18 00:00:00 GMT+09:00 2025 → ["Oct", "18", "2025"]
        const match = it.date.match(/([A-Za-z]{3}) (\d{1,2}) .* (\d{4})$/);
        if (!match) return false;

        const monthMap: Record<string, string> = {
          Jan: '01',
          Feb: '02',
          Mar: '03',
          Apr: '04',
          May: '05',
          Jun: '06',
          Jul: '07',
          Aug: '08',
          Sep: '09',
          Oct: '10',
          Nov: '11',
          Dec: '12',
        };

        const mm = monthMap[match[1]] ?? '01';
        const dd = match[2].padStart(2, '0');
        const yyyy = match[3];
        const formatted = `${yyyy}-${mm}-${dd}`;

        console.log(
          'Comparing item date:',
          formatted,
          'with selectedDate:',
          selectedDate,
        );

        return formatted === selectedDate;
      });
      console.log('filtered:', filtered);
      setFilteredUsageList(filtered);
    } else {
      setFilteredUsageList([]);
    }
  }, [usageList, selectedDate]);
  console.log('Rendered HomeScreen with selectedDate:', filteredUsageList);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
      }}>
      <Text style={{fontSize: 24, marginBottom: 10, color: '#fff'}}>
        Home Screen
      </Text>

      <Calendar
        onDayPress={(day: {dateString: React.SetStateAction<string>}) => {
          setSelectedDate(day.dateString);
          console.log('Selected date:', day.dateString);
        }}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: '#00adf5',
          },
        }}
        theme={{
          backgroundColor: '#000',
          calendarBackground: '#000',
          textSectionTitleColor: '#fff',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#fff',
          textDisabledColor: '#555',
          arrowColor: '#00adf5',
          monthTextColor: '#fff',
          indicatorColor: '#00adf5',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={{width: '100%', marginBottom: 10}}
      />

      {usageList === null ? (
        <>
          <Text style={{color: '#fff'}}>📱 사용 접근 권한이 필요합니다.</Text>
          <Button title="권한 설정 열기" onPress={openUsageAccessSettings} />
        </>
      ) : filteredUsageList.length > 0 ? (
        <ScrollView style={{width: '100%'}}>
          {filteredUsageList.map((item, index) => (
            <Text key={index} style={{marginVertical: 4, color: '#fff'}}>
              {item.appName || item.packageName}: {item.hm}
            </Text>
          ))}
        </ScrollView>
      ) : (
        <Text style={{color: '#fff'}}>선택한 날짜에 사용 기록이 없습니다.</Text>
      )}

      <Button
        title="Go to Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
