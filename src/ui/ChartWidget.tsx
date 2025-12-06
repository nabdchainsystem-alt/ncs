import React from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart, LineChart, PieChart, Activity } from 'lucide-react';

interface ChartWidgetProps {
    title: string;
    type: 'bar' | 'line' | 'pie' | 'donut' | 'gauge' | 'funnel' | 'radar' | 'scatter' | 'heatmap' | 'treemap' | 'map' | 'sankey' | 'mixed';
    data?: any; // Flexible data input
    isEmpty?: boolean;
    onConnect?: () => void;
    onTitleChange?: (newTitle: string) => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ title, type, data, isEmpty, onConnect, onTitleChange }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(title);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setEditTitle(title);
    }, [title]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleTitleSubmit = () => {
        setIsEditing(false);
        if (editTitle.trim() !== title && onTitleChange) {
            onTitleChange(editTitle.trim());
        } else {
            setEditTitle(title);
        }
    };

    if (isEmpty) {
        return (
            <div className="bg-white p-5 rounded-2xl border border-dashed border-gray-300 shadow-sm flex flex-col items-center justify-center h-full min-h-[300px] hover:bg-gray-50 transition-colors cursor-pointer group" onClick={onConnect}>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <BarChart size={24} className="text-gray-400 group-hover:text-blue-500" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">Connect Data Source</span>
            </div>
        );
    }

    const getOption = () => {
        // Default sample data if no data provided
        const sampleData = {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [120, 200, 150, 80, 70, 110, 130]
        };

        const chartData = data || sampleData;

        const baseOption = {
            title: {
                text: title,
                left: 'center',
                textStyle: {
                    fontSize: 14,
                    fontWeight: 'normal',
                    color: '#6b7280'
                },
                show: false // Hide default ECharts title to use custom one
            },
            tooltip: {
                trigger: 'axis'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: chartData.categories,
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280' }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#f3f4f6' } },
                axisLabel: { color: '#6b7280' }
            },
            series: [{
                data: chartData.values,
                type: type,
                smooth: true,
                itemStyle: { color: '#3b82f6' },
                areaStyle: type === 'line' ? {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
                    }
                } : undefined
            }]
        };

        if (type === 'pie' || type === 'donut' || (title && title.toLowerCase().includes('donut'))) {
            return {
                ...baseOption,
                tooltip: { trigger: 'item' },
                xAxis: undefined,
                yAxis: undefined,
                grid: undefined,
                series: [{
                    name: title,
                    type: 'pie',
                    radius: type === 'donut' || (title && title.toLowerCase().includes('donut')) ? ['40%', '70%'] : '50%',
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false, position: 'center' },
                    emphasis: {
                        label: { show: true, fontSize: 20, fontWeight: 'bold' }
                    },
                    data: chartData.values.map((val: number, idx: number) => ({
                        value: val,
                        name: chartData.categories[idx]
                    }))
                }]
            };
        }

        if (type === 'gauge' || (title && title.toLowerCase().includes('gauge'))) {
            return {
                series: [
                    {
                        type: 'gauge',
                        progress: {
                            show: true,
                            width: 18
                        },
                        axisLine: {
                            lineStyle: {
                                width: 18
                            }
                        },
                        axisTick: { show: false },
                        splitLine: {
                            length: 15,
                            lineStyle: {
                                width: 2,
                                color: '#999'
                            }
                        },
                        axisLabel: {
                            distance: 25,
                            color: '#999',
                            fontSize: 14
                        },
                        anchor: {
                            show: true,
                            showAbove: true,
                            size: 25,
                            itemStyle: {
                                borderWidth: 10
                            }
                        },
                        title: { show: false },
                        detail: {
                            valueAnimation: true,
                            fontSize: 30,
                            offsetCenter: [0, '70%']
                        },
                        data: [
                            {
                                value: chartData.value || 50,
                                name: chartData.name || 'Score'
                            }
                        ]
                    }
                ]
            };
        }

        if (type === 'funnel' || (title && title.toLowerCase().includes('funnel'))) {
            return {
                tooltip: { trigger: 'item' },
                series: [
                    {
                        name: title,
                        type: 'funnel',
                        left: '10%',
                        top: 60,
                        bottom: 60,
                        width: '80%',
                        min: 0,
                        max: 100,
                        minSize: '0%',
                        maxSize: '100%',
                        sort: 'descending',
                        gap: 2,
                        label: {
                            show: true,
                            position: 'inside'
                        },
                        labelLine: {
                            length: 10,
                            lineStyle: {
                                width: 1,
                                type: 'solid'
                            }
                        },
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 1
                        },
                        emphasis: {
                            label: {
                                fontSize: 20
                            }
                        },
                        data: chartData.values.map((val: number, idx: number) => ({
                            value: val,
                            name: chartData.categories[idx]
                        }))
                    }
                ]
            };
        }

        if (type === 'radar' || (title && title.toLowerCase().includes('radar'))) {
            return {
                radar: {
                    indicator: chartData.indicators || [
                        { name: 'Metric A', max: 100 },
                        { name: 'Metric B', max: 100 },
                        { name: 'Metric C', max: 100 },
                        { name: 'Metric D', max: 100 },
                        { name: 'Metric E', max: 100 }
                    ]
                },
                series: [
                    {
                        name: title,
                        type: 'radar',
                        data: [
                            {
                                value: chartData.values || [60, 73, 85, 40, 50],
                                name: 'Current'
                            }
                        ]
                    }
                ]
            };
        }

        if (type === 'scatter') {
            return {
                xAxis: {},
                yAxis: {},
                series: [
                    {
                        symbolSize: 20,
                        data: chartData.values,
                        type: 'scatter'
                    }
                ]
            };
        }

        if (type === 'heatmap' || (title && title.toLowerCase().includes('heatmap'))) {
            return {
                tooltip: {
                    position: 'top'
                },
                grid: {
                    height: '70%',
                    top: '10%'
                },
                xAxis: {
                    type: 'category',
                    data: chartData.xLabels || ['A', 'B', 'C', 'D', 'E'],
                    splitArea: {
                        show: true
                    }
                },
                yAxis: {
                    type: 'category',
                    data: chartData.yLabels || ['1', '2', '3', '4'],
                    splitArea: {
                        show: true
                    }
                },
                visualMap: {
                    min: 0,
                    max: 100,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '0%'
                },
                series: [{
                    name: title,
                    type: 'heatmap',
                    data: chartData.values || [],
                    label: {
                        show: true
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
        }

        if (type === 'sankey' || (title && title.toLowerCase().includes('sankey'))) {
            return {
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove'
                },
                series: [
                    {
                        type: 'sankey',
                        data: chartData.nodes || [
                            { name: 'Source A' },
                            { name: 'Source B' },
                            { name: 'Target X' },
                            { name: 'Target Y' }
                        ],
                        links: chartData.links || [
                            { source: 'Source A', target: 'Target X', value: 10 },
                            { source: 'Source A', target: 'Target Y', value: 5 },
                            { source: 'Source B', target: 'Target X', value: 8 },
                            { source: 'Source B', target: 'Target Y', value: 12 }
                        ],
                        emphasis: {
                            focus: 'adjacency'
                        },
                        lineStyle: {
                            color: 'gradient',
                            curveness: 0.5
                        }
                    }
                ]
            };
        }

        if (type === 'treemap' || (title && title.toLowerCase().includes('treemap'))) {
            return {
                tooltip: {
                    trigger: 'item'
                },
                series: [
                    {
                        type: 'treemap',
                        data: chartData.data || [
                            {
                                name: 'Category A',
                                value: 40,
                                children: [
                                    { name: 'Sub A1', value: 20 },
                                    { name: 'Sub A2', value: 20 }
                                ]
                            },
                            {
                                name: 'Category B',
                                value: 30,
                                children: [
                                    { name: 'Sub B1', value: 15 },
                                    { name: 'Sub B2', value: 15 }
                                ]
                            }
                        ]
                    }
                ]
            };
        }

        if (type === 'mixed' || (title && title.toLowerCase().includes('mixed'))) {
            return {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    }
                },
                grid: {
                    right: '20%'
                },
                legend: {
                    data: ['Bar Data', 'Line Data']
                },
                xAxis: [
                    {
                        type: 'category',
                        axisTick: {
                            alignWithLabel: true
                        },
                        data: chartData.categories || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'Bar',
                        position: 'left',
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#5470C6'
                            }
                        }
                    },
                    {
                        type: 'value',
                        name: 'Line',
                        position: 'right',
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#91CC75'
                            }
                        }
                    }
                ],
                series: [
                    {
                        name: 'Bar Data',
                        type: 'bar',
                        data: chartData.barValues || [2.0, 4.9, 7.0, 23.2, 25.6, 76.7]
                    },
                    {
                        name: 'Line Data',
                        type: 'line',
                        yAxisIndex: 1,
                        data: chartData.lineValues || [2.0, 2.2, 3.3, 4.5, 6.3, 10.2]
                    }
                ]
            };
        }

        if (type === 'map' || (title && title.toLowerCase().includes('map'))) {
            return {
                title: {
                    text: title || 'Map View',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: '#9ca3af',
                        fontSize: 14,
                        fontWeight: 'normal'
                    }
                },
                series: [],
                graphic: {
                    type: 'text',
                    left: 'center',
                    top: 'center',
                    style: {
                        text: 'Map visualization temporarily unavailable',
                        fill: '#9ca3af',
                        fontSize: 14
                    }
                }
            };
        }

        return baseOption;
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm h-full min-h-[300px] flex flex-col">
            <div className="flex justify-center mb-2">
                {isEditing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                        className="text-sm font-normal text-gray-900 text-center border-b border-blue-500 outline-none bg-transparent"
                        autoFocus
                    />
                ) : (
                    <h3
                        className="text-sm font-normal text-gray-500 cursor-text hover:text-blue-600 transition-colors text-center"
                        onClick={() => {
                            if (onTitleChange) setIsEditing(true);
                        }}
                    >
                        {title}
                    </h3>
                )}
            </div>
            <div className="flex-1 w-full h-full relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                        <div className="flex items-end justify-center space-x-2 h-24 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-4 bg-blue-500/80 rounded-t-sm"
                                    style={{
                                        animation: 'grow 1.5s ease-in-out infinite',
                                        animationDelay: `${i * 0.15}s`
                                    }}
                                />
                            ))}
                            <style>{`
                                @keyframes grow {
                                    0%, 100% { height: 20%; opacity: 0.3; }
                                    50% { height: 80%; opacity: 1; }
                                }
                            `}</style>
                        </div>
                        <span className="text-xs font-medium text-gray-400 animate-pulse">Loading data...</span>
                    </div>
                ) : (
                    <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} />
                )}
            </div>
        </div>
    );
};

export default ChartWidget;
