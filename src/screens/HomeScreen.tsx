import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView,
  Text,
  Platform,
  NativeModules,
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toYMD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

type IntentLauncherModule = {
  startActivity: (params: {action: string; data?: string}) => void;
};

const HomeScreen: React.FC<Props> = ({navigation: _navigation}) => {
  const [usageList, setUsageList] = useState<any[] | null>(null);
  const [filteredUsageList, setFilteredUsageList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // Maintain a continuously growing days array for infinite left scrolling
  const [days, setDays] = useState(() => {
    const today = new Date();
    const initialDays = [];
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    for (let i = -13; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = (d.getDay() + 6) % 7;
      initialDays.push({
        full: toYMD(d),
        day: String(d.getDate()),
        label: labels[weekday],
        isSelected: toYMD(d) === selectedDate,
      });
    }
    return initialDays;
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const isLoadingMoreRef = useRef(false);
  const today = new Date();
  const todayYMD = toYMD(today);
  const handleAppPress = (pkg?: string) => {
    if (!pkg) {
      return;
    }

    if (Platform.OS !== 'android') {
      return;
    }

    const launcher = NativeModules.IntentLauncher as
      | IntentLauncherModule
      | undefined;

    if (!launcher?.startActivity) {
      console.warn('IntentLauncher native module is not available');
      return;
    }

    try {
      launcher.startActivity({
        action: 'android.settings.APPLICATION_DETAILS_SETTINGS',
        data: `package:${pkg}`,
      });
    } catch (error) {
      console.warn('Failed to open the app settings screen', error);
    }
  };

  // Update filtered usage list when usageList or selectedDate changes
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

        return formatted === selectedDate;
      });
      setFilteredUsageList(filtered);
    } else {
      setFilteredUsageList([]);
    }
  }, [usageList, selectedDate]);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await getUsageData(); // ✅ 이제 배열로 들어옴
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

  // Handle infinite left scroll by prepending older days
  const handleScroll = (e: any) => {
    const {contentOffset} = e.nativeEvent;
    if (contentOffset.x <= 20 && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      setDays(prevDays => {
        const firstDayStr = prevDays[0].full;
        const firstDayDate = new Date(firstDayStr);
        const labels = ['월', '화', '수', '목', '금', '토', '일'];
        const newDays = [];
        for (let i = 1; i <= 7; i++) {
          const d = new Date(firstDayDate);
          d.setDate(d.getDate() - i);
          const weekday = (d.getDay() + 6) % 7;
          newDays.unshift({
            full: toYMD(d),
            day: String(d.getDate()),
            label: labels[weekday],
            isSelected: toYMD(d) === selectedDate,
          });
        }
        return [...newDays, ...prevDays];
      });
      // After prepending, maintain scroll position to avoid jump
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({x: 280, animated: false});
        }
        isLoadingMoreRef.current = false;
      }, 50);
    }
  };

  // Update isSelected in days when selectedDate changes
  useEffect(() => {
    setDays(prevDays =>
      prevDays.map(day => ({
        ...day,
        isSelected: day.full === selectedDate,
      })),
    );
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>{selectedDate}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentOffset={{x: 280, y: 0}} // initial offset to show near today
          >
            {days.map(({day, label, full, isSelected}, index) => {
              const isFuture = full > todayYMD;
              if (isFuture) return null; // Do not render future days
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedDate(full);
                  }}
                  style={[
                    styles.dateItem,
                    isSelected && styles.dateItemSelected,
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.dateLabel,
                      isSelected && styles.dateLabelSelected,
                    ]}>
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.dateDay,
                      isSelected && styles.dateDaySelected,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Circular progress visualization */}
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <Text style={styles.circleTitle}>집중한 시간</Text>
          <Text style={styles.circleTime}>3시간 20분</Text>
        </View>
        <View style={styles.circle}>
          <Text style={styles.circleTitle}>SNS한 시간</Text>
          <Text style={styles.circleTime}>1시간 15분</Text>
        </View>
      </View>

      {/* Task list */}
      <View style={styles.taskList}>
        {filteredUsageList.map((it, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleAppPress(it.packageName)}
            style={styles.taskItem}
            activeOpacity={0.7}>
            {(() => {
              const uri =
                it.iconUri ||
                (it.iconBase64
                  ? `data:image/png;base64,${it.iconBase64}`
                  : null) ||
                (it.icon ? `data:image/png;base64,${it.icon}` : null);
              if (uri) {
                return <Image source={{uri}} style={styles.appIcon} />;
              }
              return <Ionicons name="apps-outline" size={24} color="#fff" />;
            })()}
            <View style={{marginLeft: 12}}>
              <Text style={styles.taskText}>
                {it.appName || it.packageName}
              </Text>
              <Text style={[styles.taskText, {fontSize: 14, color: '#ccc'}]}>
                {it.hm}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating add button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.7}>
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  navButton: {
    paddingHorizontal: 10,
  },
  selectedDateContainer: {
    flex: 1,
  },
  selectedDateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  dateItem: {
    alignItems: 'center',
    width: 40,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateItemSelected: {
    backgroundColor: '#222',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateDaySelected: {
    color: '#4da3ff',
  },
  dateLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  dateLabelSelected: {
    color: '#4da3ff',
  },
  circleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  circleTime: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskList: {
    // marginTop: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
  },
  appIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#fff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default HomeScreen;
