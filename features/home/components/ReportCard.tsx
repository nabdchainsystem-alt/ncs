import React, { useState, useMemo } from 'react';
// import ReactECharts from 'echarts-for-react';

interface Report {
    id: number;
    level: string;
    title: string;
    description: string;
    category: string;
    chartType: string;
    dataFields: string[];
}

interface ReportCardProps {
    report: Report;
    onClick: (id: number) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const chartOption = useMemo(() => {
        const baseOption: any = {
            grid: { top: 10, right: 10, bottom: 10, left: 10, containLabel: false },
            xAxis: { show: false, type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
            yAxis: { show: false, type: 'value' },
            series: [] as any[],
            animation: isHovered,
            animationDuration: 1000,
            color: ['#000000', '#666666', '#999999', '#cccccc']
        };

        const dummyData = isHovered
            ? [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100]
            : [30, 50, 40, 70, 50];

        switch (report.chartType) {
            case 'bar':
            case 'histogram':
                baseOption.series = [{
                    type: 'bar',
                    data: dummyData,
                    itemStyle: { borderRadius: 2 }
                }];
                break;
            case 'line':
            case 'area':
                baseOption.series = [{
                    type: 'line',
                    data: dummyData,
                    smooth: true,
                    areaStyle: report.chartType === 'area' ? { opacity: 0.2 } : undefined,
                    lineStyle: { width: 2 }
                }];
                break;
            case 'pie':
            case 'doughnut':
                baseOption.series = [{
                    type: 'pie',
                    radius: report.chartType === 'doughnut' ? ['40%', '70%'] : '70%',
                    center: ['50%', '50%'],
                    data: [
                        { value: dummyData[0], name: 'A' },
                        { value: dummyData[1], name: 'B' },
                        { value: dummyData[2], name: 'C' }
                    ],
                    label: { show: false }
                }];
                // Remove axes for pie
                baseOption.xAxis = { show: false } as any;
                baseOption.yAxis = { show: false } as any;
                break;
            case 'scatter':
                baseOption.series = [{
                    type: 'scatter',
                    symbolSize: 8,
                    data: [
                        [10, dummyData[0]], [20, dummyData[1]], [30, dummyData[2]], [40, dummyData[3]], [50, dummyData[4]]
                    ]
                }];
                break;
            case 'radar':
                baseOption.radar = { indicator: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }], splitLine: { show: false }, splitArea: { show: false }, axisLine: { show: false } } as any;
                baseOption.series = [{
                    type: 'radar',
                    data: [{ value: dummyData }],
                    symbol: 'none',
                    areaStyle: { opacity: 0.2 }
                }];
                // Remove axes
                baseOption.xAxis = { show: false } as any;
                baseOption.yAxis = { show: false } as any;
                break;
            case 'gauge':
                baseOption.series = [{
                    type: 'gauge',
                    detail: { show: false },
                    axisLine: { lineStyle: { width: 8 } },
                    pointer: { show: true, length: '60%' },
                    data: [{ value: dummyData[0] }]
                }];
                baseOption.xAxis = { show: false } as any;
                baseOption.yAxis = { show: false } as any;
                break;
            case 'waterfall':
                // Simplified waterfall representation as bar
                baseOption.series = [{
                    type: 'bar',
                    stack: 'total',
                    itemStyle: { color: 'transparent' },
                    data: [0, 30, 60, 90, 0]
                }, {
                    type: 'bar',
                    stack: 'total',
                    data: [30, 30, 30, 30, 120]
                }];
                break;
            case 'boxplot':
                baseOption.series = [{
                    type: 'boxplot',
                    data: [
                        [10, 20, 30, 40, 50],
                        [20, 30, 40, 50, 60]
                    ]
                }];
                break;
            default: // table or others -> show a generic bar or grid
                baseOption.series = [{
                    type: 'bar',
                    data: dummyData,
                    itemStyle: { color: '#e5e7eb' } // Light grey for table placeholder
                }];
                break;
        }
        return baseOption;
    }, [report.chartType, isHovered]);

    return (
        <div
            className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-black transition-colors cursor-pointer flex flex-col h-64"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick(report.id)}
        >
            {/* Top: Chart Preview */}
            <div className="h-32 bg-gray-50 border-b border-gray-100 relative p-2 pointer-events-none flex items-center justify-center">
                {/* <ReactECharts 
                    option={chartOption} 
                    style={{ height: '100%', width: '100%' }} 
                    opts={{ renderer: 'svg' }}
                /> */}
                <span className="text-xs text-gray-400">Chart Preview Disabled</span>
                {report.chartType === 'table' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="grid grid-cols-3 gap-1 w-3/4">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="h-2 bg-black rounded-sm"></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Text Info */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1" title={report.title}>{report.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                            {report.level}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                        {report.description}
                    </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full truncate max-w-full">
                        {report.category}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ReportCard;
