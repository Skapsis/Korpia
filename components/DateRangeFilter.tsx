'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/dist/style.css';

interface DateRangeFilterProps {
  onDateChange?: (range: DateRange | undefined) => void;
}

export default function DateRangeFilter({ onDateChange }: DateRangeFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2026, 1, 1), // Feb 1, 2026
    to: new Date(2026, 1, 28),  // Feb 28, 2026
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (onDateChange) onDateChange(range);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <CalendarIcon className="w-4 h-4 text-slate-500" />
          <span>
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d MMM", { locale: es })} -{" "}
                  {format(date.to, "d MMM, yyyy", { locale: es })}
                </>
              ) : (
                format(date.from, "d MMM, yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar Fechas</span>
            )}
          </span>
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200" 
          sideOffset={5}
          align="end"
        >
          <DayPicker
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es}
            showOutsideDays
            modifiersClassNames={{
              selected: 'bg-indigo-600 text-white hover:bg-indigo-700 rounded-md',
              today: 'text-indigo-600 font-bold',
              range_start: 'bg-indigo-600 text-white rounded-l-md',
              range_end: 'bg-indigo-600 text-white rounded-r-md',
              range_middle: 'bg-indigo-100 text-indigo-900 rounded-none' // Fix middle styling
            }}
            styles={{
                day: { borderRadius: '0.375rem' } // tailwind rounded-md
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
