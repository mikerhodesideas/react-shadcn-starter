import { Line, LineChart, Bar, BarChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface VisualizationProps {
    data: any[];
    type: 'line' | 'bar' | 'area';
    xAxis: string;
    yAxis: string;
    normalized?: boolean;
    colorScheme: string[];
}

export function CampaignVisualization({ data, type, xAxis, yAxis, normalized, colorScheme }: VisualizationProps) {
    const ChartComponent = {
        line: LineChart,
        bar: BarChart,
        area: AreaChart
    }[type];

    const DataComponent = {
        line: Line,
        bar: Bar,
        area: Area
    }[type];

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ChartComponent data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey={xAxis}
                    tickFormatter={(value) => {
                        if (typeof value === 'number') {
                            return `$${(value/1000).toFixed(1)}k`;
                        }
                        return value;
                    }}
                />
                <YAxis 
                    tickFormatter={(value) => {
                        if (normalized) {
                            return `${value}%`;
                        }
                        return `$${(value/1000).toFixed(1)}k`;
                    }}
                />
                <Tooltip 
                    formatter={(value: number) => [
                        normalized ? `${value}%` : `$${value.toLocaleString()}`,
                        yAxis
                    ]}
                />
                <DataComponent
                    type="monotone"
                    dataKey={yAxis}
                    stroke={colorScheme[0]}
                    fill={colorScheme[0]}
                    stackId={normalized ? "1" : undefined}
                />
            </ChartComponent>
        </ResponsiveContainer>
    );
} 