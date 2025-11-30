import React from 'react';
import { FileText } from 'lucide-react';

interface Report {
    id: string;
    "Category 1 (Detailed)": string;
    "Module (Category 2)": string;
    "Report Title": string;
    "Chart Type (ECharts)": string;
    benefit?: string;
    kpi_definition?: string;
    formula?: string;
    data_needed?: string;
    detailed_explanation?: string;
}

interface ReportCardProps {
    report: Report;
    onAdd?: (report: Report) => void;
}

const getImageForChartType = (chartType: string) => {
    const type = chartType.toLowerCase();
    if (type.includes('bar')) return '/assets/charts/chart_bar.png';
    if (type.includes('pie') || type.includes('donut')) return '/assets/charts/chart_pie.png';
    if (type.includes('line') || type.includes('area')) return '/assets/charts/chart_line.png';
    if (type.includes('table')) return '/assets/charts/chart_table.png';
    if (type.includes('kpi')) return '/assets/charts/chart_kpi.png';
    return '/assets/charts/chart_bar.png';
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onAdd }) => {
    return (
        <div
            className="bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full overflow-hidden"
            onClick={() => onAdd?.(report)}
        >
            {/* Image Preview */}
            <div className="h-32 bg-gray-50 relative overflow-hidden">
                <img
                    src={getImageForChartType(report["Chart Type (ECharts)"])}
                    alt={report["Chart Type (ECharts)"]}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-semibold text-gray-600 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-gray-100">
                        {report["Module (Category 2)"]}
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {report["Report Title"]}
                    </h3>
                </div>

                {report.benefit && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-auto leading-relaxed">
                        {report.benefit}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReportCard;
