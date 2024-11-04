import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { addDays, format, subDays } from "date-fns"
import { useState } from "react"

const PRESET_RANGES = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Year to Date', days: 'ytd' },
]

export function DateRangeSelector({ 
  onRangeChange 
}: { 
  onRangeChange: (range: { from: Date; to: Date }) => void 
}) {
  const [date, setDate] = useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  return (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={date}
            onSelect={(range) => {
              if (range) {
                setDate(range)
                onRangeChange(range)
              }
            }}
            numberOfMonths={2}
          />
          <div className="border-t p-3 space-y-2">
            {PRESET_RANGES.map((range) => (
              <Button
                key={range.label}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  const to = new Date()
                  const from = range.days === 'ytd' 
                    ? new Date(to.getFullYear(), 0, 1)
                    : subDays(to, range.days)
                  const newRange = { from, to }
                  setDate(newRange)
                  onRangeChange(newRange)
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 