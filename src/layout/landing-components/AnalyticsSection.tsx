import React from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';

const AnalyticsSection: React.FC = () => {
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisTick: {
                    alignWithLabel: true
                },
                axisLine: {
                    lineStyle: {
                        color: '#333'
                    }
                },
                axisLabel: {
                    color: '#666'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        color: '#111'
                    }
                },
                axisLabel: {
                    color: '#666'
                }
            }
        ],
        series: [
            {
                name: 'Direct',
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#ffffff' }, // White at top
                            { offset: 1, color: '#333333' }  // Dark gray at bottom
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                data: [120, 200, 150, 80, 70, 110, 130]
            }
        ]
    };

    return (
        <div className="w-full min-h-[80vh] bg-[#050505] flex flex-col justify-center items-center py-20 relative overflow-hidden border-b border-white/5">
            <div className="max-w-7xl w-full px-6 z-10">
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter">
                            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Analytics</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl">
                            Visualize performance with immersive charts and real-time reporting.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full h-[600px] bg-[#0a0a0a] rounded-3xl border border-white/10 p-4 shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

                    <ReactECharts
                        option={option}
                        style={{ height: '100%', width: '100%' }}
                        theme="dark"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsSection;
