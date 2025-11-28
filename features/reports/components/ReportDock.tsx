import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { FileText, BarChart2, PieChart, Activity, Table, TrendingUp, Layout, Globe } from 'lucide-react';

interface ReportDockProps {
    reports: any[];
    onSelect: (report: any) => void;
    isVisible: boolean;
}

const ReportDock: React.FC<ReportDockProps> = ({ reports, onSelect, isVisible }) => {
    const mouseY = useMotionValue(Infinity);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 120, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 items-center py-6 px-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl h-[80vh] justify-center"
                    onMouseMove={(e) => mouseY.set(e.pageY)}
                    onMouseLeave={() => mouseY.set(Infinity)}
                >
                    {reports.map((report, index) => (
                        <DockIcon
                            key={index}
                            mouseY={mouseY}
                            report={report}
                            onClick={() => onSelect(report)}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DockIcon = ({ mouseY, report, onClick }: { mouseY: any, report: any, onClick: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseY, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
        return val - bounds.y - bounds.height / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [50, 90, 50]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const Icon = getIconForReport(report);

    return (
        <motion.div
            ref={ref}
            style={{ width, height: width }}
            onClick={onClick}
            className="aspect-square rounded-full bg-white/20 border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors relative group shadow-lg backdrop-blur-sm"
        >
            <Icon className="w-1/2 h-1/2 text-white" />

            {/* Tooltip */}
            <div className="absolute right-full mr-4 px-3 py-1.5 bg-black/70 backdrop-blur-md text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                {report["Report Title"]}
            </div>
        </motion.div>
    );
};

const getIconForReport = (report: any) => {
    const type = report["Chart Type (ECharts)"] || '';
    if (type.includes('Bar')) return BarChart2;
    if (type.includes('Pie')) return PieChart;
    if (type.includes('Line')) return TrendingUp;
    if (type.includes('Table')) return Table;
    if (type.includes('Heatmap')) return Activity;
    if (type.includes('Treemap')) return Layout;
    if (type.includes('Map')) return Globe;
    return FileText;
};

export default ReportDock;
