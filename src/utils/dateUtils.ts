export const toHMString = (hoursDecimal: number) => {
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return {h, m, hm: `${h}시간 ${String(m).padStart(2, '0')}분`, totalMinutes};
};

export const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const toYMD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const generateInitialDays = (selectedDate: string) => {
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
};

export const generatePreviousDays = (
  firstDayStr: string,
  count: number = 7,
) => {
  const firstDayDate = new Date(firstDayStr);
  const labels = ['월', '화', '수', '목', '금', '토', '일'];
  const newDays = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(firstDayDate);
    d.setDate(d.getDate() - i);
    const weekday = (d.getDay() + 6) % 7;
    newDays.unshift({
      full: toYMD(d),
      day: String(d.getDate()),
      label: labels[weekday],
      isSelected: false,
    });
  }
  return newDays;
};
