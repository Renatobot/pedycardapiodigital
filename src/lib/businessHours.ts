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

export { DAY_NAMES, DAY_NAMES_SHORT };
