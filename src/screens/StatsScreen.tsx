import React from 'react';
import {View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';

type StatItem = {
  id: string;
  title: string;
  value: string;
  hint?: string;
};

const stats: StatItem[] = [
  {id: '1', title: '총 정지 횟수', value: '128'},
  {id: '2', title: '평균 정지 시간', value: '00:02:34'},
  {id: '3', title: '최장 정지 시간', value: '00:15:12'},
];

const recentStops = [
  {id: 'a', when: '2025-10-28 14:23', duration: '00:03:12'},
  {id: 'b', when: '2025-10-27 09:05', duration: '00:01:45'},
  {id: 'c', when: '2025-10-26 20:44', duration: '00:05:02'},
];

const {width} = Dimensions.get('window');

const StatsScreen: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>통계</Text>

      <View style={styles.cardRow}>
        {stats.map(s => (
          <View key={s.id} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statTitle}>{s.title}</Text>
            {s.hint ? <Text style={styles.statHint}>{s.hint}</Text> : null}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>차트 (더미)</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>차트가 여기에 표시됩니다</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>최근 정지 기록</Text>
        {recentStops.map(r => (
          <View key={r.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemWhen}>{r.when}</Text>
              <Text style={styles.itemHint}>정지 시간</Text>
            </View>
            <Text style={styles.itemDuration}>{r.duration}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 16 * 2 - 12) / 3, // 3 cards with small gaps
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#555',
  },
  statHint: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartPlaceholder: {
    height: 160,
    borderRadius: 10,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: {
    color: '#9aa6b2',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e9ee',
  },
  itemWhen: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemHint: {
    fontSize: 12,
    color: '#777',
  },
  itemDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
});
