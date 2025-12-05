import React from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';

const AdvancedAnalyticsSection: React.FC = () => {
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    type: 'solid'
                }
            }
        },
        singleAxis: {
            top: 50,
            bottom: 50,
            axisTick: { show: false },
            axisLabel: { show: false },
            type: 'time',
            axisPointer: {
                animation: true,
                label: {
                    show: true
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    opacity: 0.2
                }
            }
        },
        series: [
            {
                type: 'themeRiver',
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                    show: false
                },
                data: [
                    ['2024/11/08', 10, 'DQ'], ['2024/11/09', 15, 'DQ'], ['2024/11/10', 35, 'DQ'],
                    ['2024/11/11', 38, 'DQ'], ['2024/11/12', 22, 'DQ'], ['2024/11/13', 16, 'DQ'],
                    ['2024/11/08', 35, 'TY'], ['2024/11/09', 36, 'TY'], ['2024/11/10', 37, 'TY'],
                    ['2024/11/11', 22, 'TY'], ['2024/11/12', 24, 'TY'], ['2024/11/13', 26, 'TY'],
                    ['2024/11/08', 21, 'SS'], ['2024/11/09', 25, 'SS'], ['2024/11/10', 27, 'SS'],
                    ['2024/11/11', 23, 'SS'], ['2024/11/12', 24, 'SS'], ['2024/11/13', 21, 'SS'],
                    ['2024/11/08', 10, 'QG'], ['2024/11/09', 15, 'QG'], ['2024/11/10', 35, 'QG'],
                    ['2024/11/11', 38, 'QG'], ['2024/11/12', 22, 'QG'], ['2024/11/13', 16, 'QG'],
                    ['2024/11/08', 10, 'SY'], ['2024/11/09', 15, 'SY'], ['2024/11/10', 35, 'SY'],
                    ['2024/11/11', 38, 'SY'], ['2024/11/12', 22, 'SY'], ['2024/11/13', 16, 'SY'],
                    ['2024/11/08', 10, 'DD'], ['2024/11/09', 15, 'DD'], ['2024/11/10', 35, 'DD'],
                    ['2024/11/11', 38, 'DD'], ['2024/11/12', 22, 'DD'], ['2024/11/13', 16, 'DD']
                ]
            }
        ]
    };

    return (
        <div className="w-full min-h-[80vh] bg-[#050505] flex flex-col justify-center items-center py-20 relative overflow-hidden border-b border-white/5">
            <div className="max-w-7xl w-full px-6 z-10">
                <div className="mb-12 text-right">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter">
                            Advanced <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Insights</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl ml-auto">
                            Uncover hidden patterns with AI-driven predictive modeling and complex data flows.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full h-[600px] bg-[#0a0a0a] rounded-3xl border border-white/10 p-4 shadow-2xl relative overflow-hidden"
                >
                    {/* Background Noise */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

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

export default AdvancedAnalyticsSection;
