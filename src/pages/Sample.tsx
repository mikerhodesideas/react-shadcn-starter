import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import Papa from 'papaparse';
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DailyData {
    Date: string;
    Campaign: string;
    Cost: number;
    Clicks: number;
    Impressions: number;
    Conversions: number;
    ConvValue: number;
}

interface ProcessedData {
    Date: string;
    [key: string]: string | number;
}

const colorSchemes = {
    default: ['#0ea5e9', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'],
    blues: ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#0369a1', '#0c4a6e', '#075985', '#0c4a6e'],
    greens: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314'],
    warm: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
};

export default function Sample() {
    const [data, setData] = useState<ProcessedData[]>([]);
    const [campaignTotals, setCampaignTotals] = useState<{ [key: string]: number }>({});
    const [minCost, setMinCost] = useState<number>(0);
    const [maxCost, setMaxCost] = useState<number>(1000000);
    const [maxPossibleCost, setMaxPossibleCost] = useState<number>(1000000);
    const [colorScheme, setColorScheme] = useState<keyof typeof colorSchemes>('default');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/data/daily.csv');
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV file');
                }

                const csvText = await response.text();
                
                const result = Papa.parse(csvText, {
                    header: true,
                    transform: (value: string) => {
                        if (!isNaN(Number(value))) return Number(value);
                        return value;
                    }
                });

                if (result.errors.length > 0) {
                    throw new Error('Error parsing CSV: ' + result.errors[0].message);
                }

                // Calculate total cost per campaign
                const totals = result.data.reduce((acc: { [key: string]: number }, row: any) => {
                    if (!row.Campaign || !row.Cost) return acc;
                    acc[row.Campaign] = (acc[row.Campaign] || 0) + Number(row.Cost);
                    return acc;
                }, {});

                setCampaignTotals(totals);
                
                // Set max cost only once on initial load
                if (maxPossibleCost === 1000000) {
                    const maxTotal = Math.max(...Object.values(totals));
                    setMaxPossibleCost(maxTotal);
                    setMaxCost(maxTotal);
                }

                // Get filtered campaigns
                const filteredCampaigns = Object.entries(totals)
                    .filter(([, cost]) => cost >= minCost && cost <= maxCost)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([campaign]) => campaign);

                // Process daily data for filtered campaigns
                const dailyData = result.data.reduce((acc: { [key: string]: ProcessedData }, row: any) => {
                    if (!row.Date || !filteredCampaigns.includes(row.Campaign)) return acc;
                    
                    const date = row.Date;
                    if (!acc[date]) {
                        acc[date] = {
                            Date: date,
                            ...Object.fromEntries(filteredCampaigns.map(camp => [camp, 0]))
                        };
                    }
                    
                    acc[date][row.Campaign] = Number(row.Cost);
                    return acc;
                }, {});

                const processedData = Object.values(dailyData)
                    .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

                setData(processedData);
                setError(null);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error loading data: ' + (err as Error).message);
            }
        };

        loadData();
    }, [minCost, maxCost]);

    return (
        <>
            <PageHeader>
                <PageHeaderHeading>Daily Campaign Cost Trends</PageHeaderHeading>
            </PageHeader>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="grid gap-4 mb-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Chart Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Color Scheme</label>
                            <Select value={colorScheme} onValueChange={(value: keyof typeof colorSchemes) => setColorScheme(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select color scheme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="blues">Blues</SelectItem>
                                    <SelectItem value="greens">Greens</SelectItem>
                                    <SelectItem value="warm">Warm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="mb-2">Minimum Total Cost: ${(minCost/1000).toFixed(1)}k</div>
                            <Slider
                                value={[minCost]}
                                min={0}
                                max={maxPossibleCost}
                                step={1000}
                                onValueChange={(value) => {
                                    const newMin = value[0];
                                    setMinCost(Math.min(newMin, maxCost));
                                }}
                            />
                        </div>
                        <div>
                            <div className="mb-2">Maximum Total Cost: ${(maxCost/1000).toFixed(1)}k</div>
                            <Slider
                                value={[maxCost]}
                                min={minCost}
                                max={maxPossibleCost}
                                step={1000}
                                onValueChange={(value) => {
                                    const newMax = value[0];
                                    if (newMax >= minCost) {
                                        setMaxCost(newMax);
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Cost - Filtered Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={data}>
                                <XAxis 
                                    dataKey="Date"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis 
                                    tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Legend />
                                {Object.keys(data[0] || {})
                                    .filter(key => key !== 'Date')
                                    .map((campaign, index) => (
                                        <Line
                                            key={campaign}
                                            type="monotone"
                                            dataKey={campaign}
                                            stroke={colorSchemes[colorScheme][index % colorSchemes[colorScheme].length]}
                                            name={`${campaign} ($${(campaignTotals[campaign]/1000).toFixed(1)}k total)`}
                                            dot={false}
                                        />
                                    ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
