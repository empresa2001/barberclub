type ScheduleRow = {
  from_time: string;
  to_time: string;
};

type ExceptionRow = {
  from_time: string | null;
  to_time: string | null;
};

type BusySlot = {
  date: string;
  duration_min: number;
};

export type TimeSlotAvailability = {
  time: string;
  available: boolean;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getUtcTime(date: string) {
  const parsed = new Date(date);
  return `${parsed.getUTCHours().toString().padStart(2, '0')}:${parsed.getUTCMinutes().toString().padStart(2, '0')}`;
}

export function buildTimeSlots(schedules: ScheduleRow[]) {
  const slots: string[] = [];

  schedules.forEach((schedule) => {
    let [hours, minutes] = schedule.from_time.split(':').map(Number);
    const [endHours, endMinutes] = schedule.to_time.split(':').map(Number);

    while (hours < endHours || (hours === endHours && minutes < endMinutes)) {
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      minutes += 30;
      if (minutes >= 60) {
        hours += 1;
        minutes = 0;
      }
    }
  });

  return Array.from(new Set(slots)).sort();
}

export function getSlotAvailability(params: {
  date: string;
  schedules: ScheduleRow[];
  exceptions?: ExceptionRow[] | null;
  busySlots?: BusySlot[] | null;
  durationMin: number;
  ignoreDate?: string | null;
}) {
  const { date, schedules, exceptions = [], busySlots = [], durationMin, ignoreDate } = params;
  const dayBlocked = exceptions?.some((exception) => exception.from_time === null && exception.to_time === null);
  if (dayBlocked) return [];

  const allSlots = buildTimeSlots(schedules);
  const slotsNeeded = Math.max(1, Math.ceil(durationMin / 30));

  return allSlots.map((timeSlot) => {
    const currentIndex = allSlots.indexOf(timeSlot);
    let available = true;

    for (let i = 0; i < slotsNeeded; i += 1) {
      const checkIndex = currentIndex + i;
      if (checkIndex >= allSlots.length) {
        available = false;
        break;
      }

      const checkSlot = allSlots[checkIndex];
      const checkMinutes = timeToMinutes(checkSlot);

      for (const exception of exceptions ?? []) {
        if (!exception.from_time || !exception.to_time) continue;

        const from = timeToMinutes(exception.from_time);
        const to = timeToMinutes(exception.to_time);
        if (checkMinutes >= from && checkMinutes < to) {
          available = false;
          break;
        }
      }

      if (!available) break;

      for (const busy of busySlots ?? []) {
        if (ignoreDate && new Date(busy.date).getTime() === new Date(ignoreDate).getTime()) continue;
        if (new Date(busy.date).toISOString().split('T')[0] !== date) continue;

        const busyTime = getUtcTime(busy.date);
        const busyIndex = allSlots.indexOf(busyTime);
        const busySlotsNeeded = Math.max(1, Math.ceil((busy.duration_min || 30) / 30));

        if (busyTime === checkSlot || (busyIndex !== -1 && checkIndex >= busyIndex && checkIndex < busyIndex + busySlotsNeeded)) {
          available = false;
          break;
        }
      }

      if (!available) break;
    }

    return { time: timeSlot, available };
  }) satisfies TimeSlotAvailability[];
}
