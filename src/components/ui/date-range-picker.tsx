import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
import { DateRange } from '@/lib/types/date';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    {
      label: 'Today',
      value: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: 'Last 7 days',
      value: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      value: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: 'Last 90 days',
      value: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
  ];

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y')} -{' '}
                  {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-4 p-4">
            <Select
              onValueChange={(value) => {
                const preset = presets.find((preset) => preset.label === value);
                if (preset) {
                  onChange(preset.value);
                  setIsOpen(false);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent position="popper">
                {presets.map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="border rounded-md p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={{
                  from: value?.from,
                  to: value?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onChange(range as DateRange);
                    setIsOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 