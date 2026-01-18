export interface BusinessHour {
  id: string;
  establishment_id: string;
  day_of_week: number;
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
}

export interface BusinessStatus {
  isOpen: boolean;
  message: string;
  todayHours: string | null;
  nextOpenInfo: string | null;
}

export interface ScheduleSlot {
  date: Date;
  dayLabel: string;
  dateLabel: string;
  times: string[];
}

export interface FormattedBusinessHours {
  label: string;
  hours: string | null;
  isOpen: boolean;
}

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const DAY_NAMES_SHORT = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
];

export function getDayName(dayOfWeek: number, short: boolean = false): string {
  return short ? DAY_NAMES_SHORT[dayOfWeek] : DAY_NAMES[dayOfWeek];
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  // Time comes as "HH:MM:SS" or "HH:MM", we want "HH:MM"
  return time.substring(0, 5);
}

export function checkBusinessStatus(
  hours: BusinessHour[],
  allowOrdersWhenClosed: boolean = false,
  scheduledMessage?: string | null
): BusinessStatus {
  if (hours.length === 0) {
    // No hours configured - assume always open
    return {
      isOpen: true,
      message: 'Aberto',
      todayHours: null,
      nextOpenInfo: null,
    };
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const todayHours = hours.find(h => h.day_of_week === currentDay);
  
  // Check if open today
  if (todayHours?.is_open && todayHours.opening_time && todayHours.closing_time) {
    const openTime = formatTime(todayHours.opening_time);
    const closeTime = formatTime(todayHours.closing_time);
    
    // Handle overnight hours (closes after midnight)
    const isOvernight = closeTime < openTime;
    
    let isCurrentlyOpen = false;
    if (isOvernight) {
      // Open if: after opening time OR before closing time
      isCurrentlyOpen = currentTime >= openTime || currentTime < closeTime;
    } else {
      isCurrentlyOpen = currentTime >= openTime && currentTime < closeTime;
    }
    
    if (isCurrentlyOpen) {
      return {
        isOpen: true,
        message: `Aberto agora · até ${closeTime}`,
        todayHours: `${openTime} - ${closeTime}`,
        nextOpenInfo: null,
      };
    }
    
    // Today but not yet open
    if (currentTime < openTime) {
      return {
        isOpen: false,
        message: `Fechado · abre hoje às ${openTime}`,
        todayHours: `${openTime} - ${closeTime}`,
        nextOpenInfo: `Abre hoje às ${openTime}`,
      };
    }
  }
  
  // Find next opening
  const nextOpenInfo = findNextOpen(hours, currentDay);
  
  // Check if we're in overnight hours from yesterday
  const yesterdayIndex = currentDay === 0 ? 6 : currentDay - 1;
  const yesterdayHours = hours.find(h => h.day_of_week === yesterdayIndex);
  
  if (yesterdayHours?.is_open && yesterdayHours.opening_time && yesterdayHours.closing_time) {
    const openTime = formatTime(yesterdayHours.opening_time);
    const closeTime = formatTime(yesterdayHours.closing_time);
    
    // Check overnight from yesterday
    if (closeTime < openTime && currentTime < closeTime) {
      return {
        isOpen: true,
        message: `Aberto agora · até ${closeTime}`,
        todayHours: todayHours?.is_open ? `${formatTime(todayHours.opening_time)} - ${formatTime(todayHours.closing_time)}` : null,
        nextOpenInfo: null,
      };
    }
  }

  return {
    isOpen: false,
    message: nextOpenInfo 
      ? `Fechado · ${nextOpenInfo.toLowerCase()}`
      : 'Fechado',
    todayHours: todayHours?.is_open && todayHours.opening_time && todayHours.closing_time 
      ? `${formatTime(todayHours.opening_time)} - ${formatTime(todayHours.closing_time)}` 
      : null,
    nextOpenInfo,
  };
}

function findNextOpen(hours: BusinessHour[], currentDay: number): string | null {
  // Look through next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayHours = hours.find(h => h.day_of_week === checkDay);
    
    if (dayHours?.is_open && dayHours.opening_time) {
      const dayName = i === 1 ? 'amanhã' : getDayName(checkDay);
      return `Abre ${dayName} às ${formatTime(dayHours.opening_time)}`;
    }
  }
  
  return null;
}

export function getScheduledOrderMessage(
  allowOrdersWhenClosed: boolean,
  customMessage?: string | null
): string | null {
  if (!allowOrdersWhenClosed) return null;
  
  return customMessage || 'Seu pedido será preparado quando reabrirmos.';
}

export function getAllDays(): number[] {
  return [0, 1, 2, 3, 4, 5, 6];
}

/**
 * Generate available schedule slots for scheduling orders
 * Returns slots for the next X days based on business hours
 */
export function getAvailableScheduleSlots(
  hours: BusinessHour[],
  daysAhead: number = 7
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const now = new Date();
  
  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    
    const dayHours = hours.find(h => h.day_of_week === dayOfWeek);
    
    if (dayHours?.is_open && dayHours.opening_time && dayHours.closing_time) {
      const openTime = formatTime(dayHours.opening_time);
      const closeTime = formatTime(dayHours.closing_time);
      
      // Generate 30-minute slots
      const timeSlots = generateTimeSlots(openTime, closeTime, i === 0);
      
      if (timeSlots.length > 0) {
        let dayLabel = '';
        if (i === 0) dayLabel = 'Hoje';
        else if (i === 1) dayLabel = 'Amanhã';
        else dayLabel = getDayName(dayOfWeek);
        
        slots.push({
          date,
          dayLabel,
          dateLabel: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          times: timeSlots,
        });
      }
    }
  }
  
  return slots;
}

/**
 * Generate 30-minute time slots between opening and closing times
 */
function generateTimeSlots(
  openTime: string, 
  closeTime: string, 
  isToday: boolean
): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  // If today, start from the next available slot (+ 30 min margin)
  if (isToday) {
    const now = new Date();
    const currentTimeHour = now.getHours();
    const currentTimeMin = now.getMinutes();
    
    // Advance to next 30-min slot + 30 min margin for preparation
    while (currentHour < currentTimeHour || 
           (currentHour === currentTimeHour && currentMin <= currentTimeMin + 30)) {
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
  }
  
  // Handle overnight hours
  const isOvernight = closeHour < openHour || (closeHour === openHour && closeMin < openMin);
  
  if (isOvernight) {
    // For overnight, generate until midnight, then from midnight to closing
    // For simplicity, we'll just generate until 23:30 for today's slots
    const endHour = 23;
    const endMin = 30;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
  } else {
    // Normal hours: generate slots until closing
    while (currentHour < closeHour || 
           (currentHour === closeHour && currentMin < closeMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
  }
  
  return slots;
}

/**
 * Format business hours for display, grouping consecutive days with same hours
 */
export function formatBusinessHoursForDisplay(hours: BusinessHour[]): FormattedBusinessHours[] {
  const result: FormattedBusinessHours[] = [];
  
  // Sort hours by day of week starting from Monday (1)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sat, then Sun
  const sortedHours = orderedDays.map(day => hours.find(h => h.day_of_week === day));
  
  let i = 0;
  while (i < sortedHours.length) {
    const currentHour = sortedHours[i];
    const currentDayIndex = orderedDays[i];
    
    if (!currentHour) {
      // Day not configured, show as closed
      result.push({
        label: getDayName(currentDayIndex),
        hours: null,
        isOpen: false,
      });
      i++;
      continue;
    }
    
    const currentOpen = currentHour.is_open;
    const currentOpenTime = formatTime(currentHour.opening_time);
    const currentCloseTime = formatTime(currentHour.closing_time);
    const currentHoursStr = currentOpen ? `${currentOpenTime} - ${currentCloseTime}` : null;
    
    // Look for consecutive days with same hours
    let endIndex = i;
    for (let j = i + 1; j < sortedHours.length; j++) {
      const nextHour = sortedHours[j];
      if (!nextHour) break;
      
      const nextOpen = nextHour.is_open;
      const nextOpenTime = formatTime(nextHour.opening_time);
      const nextCloseTime = formatTime(nextHour.closing_time);
      
      if (nextOpen === currentOpen && 
          nextOpenTime === currentOpenTime && 
          nextCloseTime === currentCloseTime) {
        endIndex = j;
      } else {
        break;
      }
    }
    
    // Build label
    const startDayName = getDayName(orderedDays[i], true);
    const endDayName = getDayName(orderedDays[endIndex], true);
    
    let label: string;
    if (i === endIndex) {
      label = getDayName(orderedDays[i]);
    } else {
      label = `${startDayName} a ${endDayName}`;
    }
    
    result.push({
      label,
      hours: currentHoursStr,
      isOpen: currentOpen,
    });
    
    i = endIndex + 1;
  }
  
  return result;
}

export { DAY_NAMES, DAY_NAMES_SHORT };
