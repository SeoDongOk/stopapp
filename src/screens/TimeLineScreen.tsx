import React, {useState, useRef} from 'react';
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import DateSelector from '../components/common/DateSelector';
import {getTodayString} from '../utils/dateUtils';

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

interface SelectedRange {
  startIndex: number;
  endIndex: number;
  color: string;
}

interface TodoItem {
  range: SelectedRange;
  text: string;
  startTime: string;
  endTime: string;
}

function TimelineScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null,
  );
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoText, setTodoText] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const dragStartRef = useRef<number | null>(null);

  // 초기 시간 슬롯 생성 (15분 단위)
  React.useEffect(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(
            2,
            '0',
          )}`,
          hour,
          minute,
        });
      }
    }
    setTimeSlots(slots);
  }, []);

  // 드래그 시작
  const handleMouseDown = (index: number) => {
    dragStartRef.current = index;
    setSelectedRange({
      startIndex: index,
      endIndex: index,
      color: '#FFB6C1',
    });
  };

  // 드래그 중
  const handleMouseMove = (index: number) => {
    if (dragStartRef.current !== null) {
      const start = Math.min(dragStartRef.current, index);
      const end = Math.max(dragStartRef.current, index);
      setSelectedRange({
        startIndex: start,
        endIndex: end,
        color: '#FFB6C1',
      });
    }
  };

  // 드래그 끝
  const handleMouseUp = () => {
    if (selectedRange && selectedRange.startIndex !== selectedRange.endIndex) {
      setShowTodoModal(true);
    }
    dragStartRef.current = null;
  };

  const handleAddTodo = () => {
    if (selectedRange && todoText && timeSlots.length > 0) {
      const startTime = timeSlots[selectedRange.startIndex].time;
      const endTime = timeSlots[selectedRange.endIndex].time;

      setTodos([
        ...todos,
        {
          range: selectedRange,
          text: todoText,
          startTime,
          endTime,
        },
      ]);
      setTodoText('');
      setShowTodoModal(false);
      setSelectedRange(null);
    }
  };

  const getSlotColor = (index: number): string => {
    // TODO가 있으면 그 색상
    for (const todo of todos) {
      if (index >= todo.range.startIndex && index <= todo.range.endIndex) {
        return todo.range.color;
      }
    }

    // 선택 중이면 핑크
    if (
      selectedRange &&
      index >= selectedRange.startIndex &&
      index <= selectedRange.endIndex
    ) {
      return '#FFB6C1';
    }

    return '#ffffff';
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#000'}}>
      {/* 날짜 선택 */}
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* 타임라인 */}
      <View style={{flex: 1, backgroundColor: '#fff'}}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{paddingBottom: 80}}
          showsVerticalScrollIndicator={false}>
          <View style={{flexDirection: 'row'}}>
            {/* 왼쪽: 시간 표시 + 과거 데이터 */}
            <View style={{width: 70, paddingTop: 5}}>
              {timeSlots.map((slot, idx) => (
                <View
                  key={idx}
                  style={{
                    height: 30,
                    justifyContent: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: idx % 4 === 0 ? '#333' : '#ddd',
                    borderStyle: idx % 4 === 0 ? 'solid' : 'dashed',
                  }}>
                  {idx % 4 === 0 && (
                    <Text
                      style={{fontSize: 10, color: '#666', fontWeight: '600'}}>
                      {slot.time}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* 중앙 구분선 */}
            <View style={{width: 2, backgroundColor: '#333'}} />

            {/* 오른쪽: 드래그 영역 (할일 + 과거데이터) */}
            <View style={{flex: 1}}>
              {timeSlots.map((slot, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPressIn={() => handleMouseDown(idx)}
                  onPressOut={handleMouseUp}
                  // onMouseMove={() => handleMouseMove(idx)}
                  style={{
                    height: 30,
                    borderBottomWidth: 1,
                    borderBottomColor: idx % 4 === 0 ? '#333' : '#ddd',
                    borderStyle: idx % 4 === 0 ? 'solid' : 'dashed',
                    backgroundColor: getSlotColor(idx),
                    borderLeftWidth: 1,
                    borderLeftColor: '#ddd',
                  }}
                />
              ))}
            </View>
          </View>

          {/* TODO 리스트 */}
          <View style={{marginTop: 20, paddingHorizontal: 15}}>
            {todos.length > 0 && (
              <Text
                style={{fontSize: 14, fontWeight: 'bold', marginBottom: 10}}>
                오늘의 할일
              </Text>
            )}
            {todos.map((todo, idx) => (
              <View
                key={idx}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  backgroundColor: todo.range.color,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: '#ff9500',
                }}>
                <Text style={{fontSize: 12, color: '#666', marginBottom: 4}}>
                  {todo.startTime} ~ {todo.endTime}
                </Text>
                <Text style={{fontWeight: '600', fontSize: 14, color: '#333'}}>
                  {todo.text}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* TODO 작성 모달 */}
      <Modal visible={showTodoModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              padding: 20,
              width: '80%',
            }}>
            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>
              {selectedRange && timeSlots[selectedRange.startIndex]
                ? `${timeSlots[selectedRange.startIndex].time} ~ ${
                    timeSlots[selectedRange.endIndex].time
                  }`
                : '시간 선택'}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                marginBottom: 15,
              }}
              placeholder="할일을 입력하세요"
              value={todoText}
              onChangeText={setTodoText}
              multiline
            />
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity
                onPress={() => {
                  setShowTodoModal(false);
                  setSelectedRange(null);
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: '#ccc',
                  borderRadius: 8,
                }}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddTodo}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: '#ff9500',
                  borderRadius: 8,
                }}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default TimelineScreen;
