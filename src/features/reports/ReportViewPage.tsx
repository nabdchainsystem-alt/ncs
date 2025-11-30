import React, { useMemo } from 'react';
import { ArrowLeft, FileText, Info } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import reportsData from "../../data/mockReports";
import ChartWidget from '../../ui/ChartWidget';

interface ReportViewPageProps {
    reportId: string;
}

const ReportViewPage: React.FC<ReportViewPageProps> = ({ reportId }) => {
    const { setActivePage } = useNavigation();
    const report = reportsData.find(r => r.id.toString() === reportId);

    if (!report) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Report not found
            </div>
        );
    }

    // Generate mock data based on report configuration
    const mockData = useMemo(() => {
        if (report.chartType === 'table') return null;

        // Generate random data for charts
        const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const values = categories.map(() => Math.floor(Math.random() * 1000) + 100);

        return {
            categories,
            values
        };
    }, [report]);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActivePage('home')}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{report.category}</span>
                            <span>•</span>
                            <span>{report.level}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Description Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                                <Info size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">About this Report</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    {report.chartType !== 'table' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
                            <h3 className="font-semibold text-gray-900 mb-4">Visualization</h3>
                            <div className="h-[320px]">
                                <ChartWidget
                                    title={report.title}
                                    type={report.chartType as any}
                                    data={mockData}
                                    isEmpty={false}
                                />
                            </div>
                        </div>
                    )}

                    {/* Data Preview Section (Mock Table) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Data Preview</h3>
                            <button className="text-sm text-blue-600 hover:underline font-medium">
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {report.dataFields.map((field, i) => (
                                            <th key={i} className="px-6 py-3 font-medium">{field}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[...Array(5)].map((_, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50">
                                            {report.dataFields.map((_, colIdx) => (
                                                <td key={colIdx} className="px-6 py-4 text-gray-600">
                                                    {colIdx === 0 ? `Item ${rowIdx + 1}` : Math.floor(Math.random() * 1000)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
                            Showing 5 sample records
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViewPage;
