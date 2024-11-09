// src/components/budget-optimization/budget-slider.tsx
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { CampaignProjection } from "./types"

interface BudgetSliderProps {
  projection: CampaignProjection;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}

export function BudgetSlider({
  projection,
  value,
  onChange,
  disabled
}: BudgetSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-[150px]">
        ${Math.round(projection.projectedCost).toLocaleString()}
        <span className="text-muted-foreground ml-2">
          ({projection.percentChange > 0 ? '+' : ''}${Math.round(projection.projectedCost - projection.currentCost).toLocaleString()})
        </span>
      </div>
      <div className="flex items-center gap-2 min-w-[200px]">
        <Slider
          min={-100}
          max={100}
          step={5}
          disabled={disabled}
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          className={cn(
            "flex-grow",
            disabled && "opacity-50",
            !disabled && value > 0 && "[&>.relative>.bg-primary]:bg-green-500",
            !disabled && value < 0 && "[&>.relative>.bg-primary]:bg-red-500",
            !disabled && value === 0 && "[&>.relative>.bg-primary]:bg-muted-foreground"
          )}
        />
        <span className="text-sm w-12 text-right">
          {value}%
        </span>
      </div>
    </div>
  );
}