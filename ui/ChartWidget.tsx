import React from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart, LineChart, PieChart, Activity } from 'lucide-react';

interface ChartWidgetProps {
    title: string;
    type: 'bar' | 'line' | 'pie';
    data?: any; // Flexible data input
    isEmpty?: boolean;
    onConnect?: () => void;
    onTitleChange?: (newTitle: string) => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ title, type, data, isEmpty, onConnect, onTitleChange }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(title);

    React.useEffect(() => {
        setEditTitle(title);
    }, [title]);

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

        if (type === 'pie') {
            return {
                ...baseOption,
                tooltip: { trigger: 'item' },
                xAxis: undefined,
                yAxis: undefined,
                grid: undefined,
                series: [{
                    name: title,
                    type: 'pie',
                    radius: ['40%', '70%'],
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
            <div className="flex-1 w-full h-full">
                <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
};

export default ChartWidget;
