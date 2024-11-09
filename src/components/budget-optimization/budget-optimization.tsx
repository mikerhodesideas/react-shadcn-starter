// src/components/budget-optimization/budget-optimization.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetSlider } from "./budget-slider";
import { useCampaignProjections } from "./use-campaign-projections";
import { OptimizationMode, ProjectionFilter } from "./types";

interface MetricDisplayProps {
    label: string;
    value: number;
    previousValue: number;
    formatter?: (n: number) => string;
    inverse?: boolean;
    isPercentage?: boolean;
}

function MetricDisplay({
    label,
    value,
    previousValue,
    formatter = (n) => Math.round(n).toLocaleString(),
    inverse = false,
    isPercentage = false
}: MetricDisplayProps) {
    const percentChange = previousValue ? ((value - previousValue) / Math.abs(previousValue)) * 100 : 0;
    const formattedValue = isPercentage ? `${formatter(value)}%` : `$${formatter(value)}`;

    return (
        <div className="text-center">
            <p className="text-sm font-medium">{label}</p>
            <div className="mt-1">
                <p className="text-xl font-bold">{formattedValue}</p>
                {percentChange !== 0 && (
                    <p className={`text-sm ${percentChange === 0 ? 'text-muted-foreground' :
                        percentChange > 0 === !inverse ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {percentChange > 0 ? '↑' : '↓'} {Math.abs(Math.round(percentChange))}%
                    </p>
                )}
            </div>
        </div>
    );
}

const getInitialAdjustment = (projection: CampaignProjection, mode: OptimizationMode): number => {
    // Early return if high IS or mode is none
    if (projection.isHighIS || mode === 'none') {
        return 0;
    }

    // Determine base multiplier based on mode
    const multiplier = mode === 'conservative' ? 0.5 : 
                      mode === 'balanced' ? 1.0 :
                      mode === 'aggressive' ? 1.5 : 0;

    // Calculate optimal midpoint
    const optimalMidpoint = (projection.optimalMin + projection.optimalMax) / 2;
    
    // If campaign is unprofitable, suggest reduction
    if (projection.currentProfit <= 0) {
        return mode === 'conservative' ? -25 :
               mode === 'balanced' ? -50 :
               mode === 'aggressive' ? -75 : 0;
    }

    // If campaign is below optimal minimum
    if (projection.currentCost < projection.optimalMin) {
        const percentBelow = ((projection.optimalMin - projection.currentCost) / projection.currentCost) * 100;
        return Math.min(100, Math.round(percentBelow * multiplier));
    }

    // If campaign is above optimal maximum
    if (projection.currentCost > projection.optimalMax) {
        const percentAbove = ((projection.currentCost - projection.optimalMax) / projection.currentCost) * 100;
        return Math.max(-100, Math.round(-percentAbove * multiplier));
    }

    // If within optimal range, make small adjustments based on position within range
    const positionInRange = (projection.currentCost - projection.optimalMin) / 
                           (projection.optimalMax - projection.optimalMin);
    if (positionInRange < 0.4) {
        return Math.round(10 * multiplier);
    } else if (positionInRange > 0.6) {
        return Math.round(-10 * multiplier);
    }

    return 0; // Already in optimal position
};

export function BudgetOptimization({
    campaigns,
    cogsPercentage,
    includeFilter,
    excludeFilter,
    rowLimit
}: {
    campaigns: Campaign[];
    cogsPercentage: number;
    includeFilter: string;
    excludeFilter: string;
    rowLimit: number;
}) {
    const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('none');
    const [projectionFilter, setProjectionFilter] = useState<ProjectionFilter>('all');

    const {
        campaignProjections,
        projectedMetrics,
        rowAdjustments,
        setRowAdjustments
    } = useCampaignProjections(
        campaigns,
        cogsPercentage,
        optimizationMode,
        includeFilter,
        excludeFilter
    );

    // Filter projections based on user selection
    const filteredProjections = campaignProjections.filter(projection => {
        // Get the current adjustment from rowAdjustments
        const currentAdjustment = rowAdjustments[projection.name]?.adjustment ?? 0;

        // High IS campaigns should only show in high-is tab
        if (projection.isHighIS) {
            return projectionFilter === 'high-is' || projectionFilter === 'all';
        }

        switch (projectionFilter) {
            case 'increase':
                // Only show campaigns where user has set a positive adjustment
                return currentAdjustment > 0;
            case 'decrease':
                // Only show campaigns where user has set a negative adjustment
                return currentAdjustment < 0;
            case 'nochange':
                // Show campaigns where user hasn't made any adjustment
                // and they're not high IS campaigns
                return currentAdjustment === 0 && !projection.isHighIS;
            case 'high-is':
                return projection.isHighIS;
            default:
                return true;
        }
    }).slice(0, rowLimit);

    const getStatusDisplay = (projection: CampaignProjection) => {
        const currentAdjustment = rowAdjustments[projection.name]?.adjustment ?? 0;

        if (projection.isHighIS) {
            return (
                <span className="text-blue-600">
                    High Impression Share ({Math.round(projection.currentIS)}%)
                </span>
            );
        }

        if (currentAdjustment === 0) {
            return <span className="text-yellow-600">No Change</span>;
        }

        if (currentAdjustment > 0) {
            return <span className="text-green-600">Increase ({currentAdjustment}%)</span>;
        }

        return <span className="text-red-600">Decrease ({currentAdjustment}%)</span>;
    };

    const handleModeChange = (mode: OptimizationMode) => {
        setOptimizationMode(mode);
        
        // Calculate new adjustments for all campaigns
        const newAdjustments = campaignProjections.reduce((acc, projection) => {
            acc[projection.name] = {
                campaignName: projection.name,
                adjustment: getInitialAdjustment(projection, mode)
            };
            return acc;
        }, {} as Record<string, RowAdjustment>);

        setRowAdjustments(newAdjustments);
    };

    return (
        <div className="space-y-6">
            {/* Strategy Selection */}
            <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium whitespace-nowrap">
                    Optimization Strategy:
                </span>
                <div className="flex gap-2">
                    {(['none', 'conservative', 'balanced', 'aggressive'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`px-4 py-2 rounded-md ${optimizationMode === mode
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            {/* Projected Performance Impact */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Projected Performance Impact</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-8 gap-3">
                        <MetricDisplay
                            label="Total Cost"
                            value={projectedMetrics.projected.cost}
                            previousValue={projectedMetrics.current.cost}
                            inverse={true}
                        />
                        <MetricDisplay
                            label="Total Revenue"
                            value={projectedMetrics.projected.revenue}
                            previousValue={projectedMetrics.current.revenue}
                        />
                        <MetricDisplay
                            label="Total Profit"
                            value={projectedMetrics.projected.profit}
                            previousValue={projectedMetrics.current.profit}
                        />
                        <MetricDisplay
                            label="Avg CPA"
                            value={projectedMetrics.projected.cost / projectedMetrics.projected.conversions}
                            previousValue={projectedMetrics.current.cost / projectedMetrics.current.conversions}
                            formatter={(n) => n.toFixed(2)}
                            inverse={true}
                        />
                        <MetricDisplay
                            label="Conv Rate"
                            value={(projectedMetrics.projected.conversions / (projectedMetrics.projected.cost / 2)) * 100}
                            previousValue={(projectedMetrics.current.conversions / (projectedMetrics.current.cost / 2)) * 100}
                            formatter={(n) => n.toFixed(1)}
                            isPercentage={true}
                        />
                        <MetricDisplay
                            label="ROAS"
                            value={projectedMetrics.projected.revenue / projectedMetrics.projected.cost}
                            previousValue={projectedMetrics.current.revenue / projectedMetrics.current.cost}
                            formatter={(n) => `${n.toFixed(1)}x`}
                        />
                        <MetricDisplay
                            label="Revenue per Extra $1"
                            value={(projectedMetrics.projected.revenue - projectedMetrics.current.revenue) /
                                (projectedMetrics.projected.cost - projectedMetrics.current.cost)}
                            previousValue={0}
                            formatter={(n) => n.toFixed(2)}
                        />
                        <MetricDisplay
                            label="Total Conversions"
                            value={projectedMetrics.projected.conversions}
                            previousValue={projectedMetrics.current.conversions}
                            formatter={(n) => Math.round(n).toLocaleString()}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Budget Change Projections */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Budget Change Projections</CardTitle>
                        <Tabs
                            value={projectionFilter}
                            onValueChange={(value) => setProjectionFilter(value as ProjectionFilter)}
                        >
                            <TabsList>
                                <TabsTrigger value="all">All Changes</TabsTrigger>
                                <TabsTrigger value="increase">Increases</TabsTrigger>
                                <TabsTrigger value="decrease">Decreases</TabsTrigger>
                                <TabsTrigger value="nochange">No Change</TabsTrigger>
                                <TabsTrigger value="high-is">High IS</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-2">Campaign</th>
                                <th className="px-4 py-2">Projected Cost</th>
                                <th className="px-4 py-2">Projected Profit</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Change Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjections.map(projection => (
                                <tr key={projection.name} className="border-b">
                                    <td className="px-4 py-2">
                                        {projection.name}
                                        {projection.isHighIS && (
                                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                {Math.round(projection.currentIS)}% IS
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <BudgetSlider
                                            projection={projection}
                                            value={rowAdjustments[projection.name]?.adjustment ?? 0}
                                            onChange={(value) => {
                                                setRowAdjustments(prev => ({
                                                    ...prev,
                                                    [projection.name]: {
                                                        campaignName: projection.name,
                                                        adjustment: value
                                                    }
                                                }));
                                            }}
                                            disabled={projection.isHighIS}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={projection.projectedProfit < 0 ? 'text-red-500' : ''}>
                                            ${Math.round(projection.projectedProfit).toLocaleString()}
                                            <span className="text-muted-foreground ml-2">
                                                ({projection.profitChange > 0 ? '+' : ''}
                                                ${Math.round(projection.profitChange).toLocaleString()})
                                            </span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        {getStatusDisplay(projection)}
                                    </td>
                                    <td className="px-4 py-2">{projection.changeReason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}