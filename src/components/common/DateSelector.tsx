import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  toYMD,
  generateInitialDays,
  generatePreviousDays,
} from '../../utils/dateUtils';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  style?: ViewStyle;
}

interface DayItem {
  full: string;
  day: string;
  label: string;
  isSelected: boolean;
}

function DateSelector({selectedDate, onDateChange, style}: DateSelectorProps) {
  const [days, setDays] = React.useState<DayItem[]>(() =>
    generateInitialDays(selectedDate),
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const isLoadingMoreRef = useRef(false);
  const today = new Date();
  const todayYMD = toYMD(today);

  const handleScroll = (e: any) => {
    const {contentOffset} = e.nativeEvent;
    if (contentOffset.x <= 20 && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      setDays(prevDays => {
        const newDays = generatePreviousDays(prevDays[0].full);
        return [...newDays, ...prevDays];
      });
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({x: 280, animated: false});
        }
        isLoadingMoreRef.current = false;
      }, 50);
    }
  };

  useEffect(() => {
    setDays(prevDays =>
      prevDays.map(day => ({
        ...day,
        isSelected: day.full === selectedDate,
      })),
    );
  }, [selectedDate]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.selectedDateText}>{selectedDate}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{x: 280, y: 0}}>
        {days.map(({day, label, full, isSelected}, index) => {
          const isFuture = full > todayYMD;
          if (isFuture) return null;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onDateChange(full)}
              style={[styles.dateItem, isSelected && styles.dateItemSelected]}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.dateLabel,
                  isSelected && styles.dateLabelSelected,
                ]}>
                {label}
              </Text>
              <Text
                style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
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
});

export default DateSelector;
