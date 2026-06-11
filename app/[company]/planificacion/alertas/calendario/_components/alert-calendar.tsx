'use client';

import { PlanificationAlertResource } from '@api/types.gen';
import { CalendarEventExternal, createViewDay, createViewMonthGrid, createViewWeek } from '@schedule-x/calendar';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { ScheduleXCalendar, useNextCalendarApp } from '@schedule-x/react';
import '@schedule-x/theme-default/dist/index.css';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AlertEventModal } from './alert-event-modal';
import { DateGridEvent } from './date-grid-event';
import { MonthGridEvent } from './month-grid-event';

const alertCalendars = {
  OVERDUE: {
    colorName: 'OVERDUE',
    lightColors: {
      main: '#ef4444',
      container: '#fee2e2',
      onContainer: '#7f1d1d',
    },
    darkColors: {
      main: '#fca5a5',
      container: '#7f1d1d',
      onContainer: '#fecaca',
    },
  },
  WARNING: {
    colorName: 'WARNING',
    lightColors: {
      main: '#f59e0b',
      container: '#fef3c7',
      onContainer: '#78350f',
    },
    darkColors: {
      main: '#fde68a',
      container: '#78350f',
      onContainer: '#fef3c7',
    },
  },
  OK: {
    colorName: 'OK',
    lightColors: {
      main: '#10b981',
      container: '#d1fae5',
      onContainer: '#064e3b',
    },
    darkColors: {
      main: '#6ee7b7',
      container: '#064e3b',
      onContainer: '#d1fae5',
    },
  },
};

function alertToEvent(alert: PlanificationAlertResource): CalendarEventExternal {
  const dateValue = alert.earliest_due_date;

  return {
    id: alert.id,
    // start: dateValue + ' 00:00',
    // end: dateValue + ' 23:59',
    start: dateValue,
    end: dateValue,
    title: alert.item_identifier,
    calendar: alert.status,
    _alert: alert,
  };
}

type DateRange = { start: string; end: string };

type AlertCalendarProps = {
  alerts: PlanificationAlertResource[];
  theme?: 'dark' | 'light';
  onRangeUpdate?: (range: DateRange) => void;
};

export function AlertCalendar({ alerts, theme = 'light', onRangeUpdate }: AlertCalendarProps) {
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const eventModal = useMemo(() => createEventModalPlugin(), []);

  const events = useMemo(() => alerts.filter((a) => a.earliest_due_date).map(alertToEvent), [alerts]);

  const calendar = useNextCalendarApp({
    views: [createViewMonthGrid(), createViewWeek()],
    calendars: alertCalendars,
    events,
    locale: 'es-ES',
    defaultView: 'month',
    isResponsive: true,
    plugins: [eventsService, eventModal],
    dayBoundaries: { start: '06:00', end: '18:00' },
    callbacks: {
      onRangeUpdate,
    },
  });

  useEffect(() => {
    if (eventsService) {
      eventsService.set(events);
    }
  }, [events, eventsService]);

  useEffect(() => {
    calendar?.setTheme(theme);
  }, [theme, calendar]);

  return (
    <div className="[&_.sx-react-calendar-wrapper]:!w-full overflow-x-auto">
      <ScheduleXCalendar calendarApp={calendar} customComponents={customComponents} />
    </div>
  );
}

const customComponents: Record<string, React.ComponentType<any>> = {
  eventModal: AlertEventModal,
  monthGridEvent: MonthGridEvent,
  dateGridEvent: DateGridEvent,
};
