import { AsyncECharts } from '../charts/AsyncECharts';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const orders = [32, 40, 28, 45, 52, 60, 48, 58, 62, 55, 50, 68];
const onTime = [88, 90, 87, 91, 92, 93, 90, 94, 95, 92, 91, 93];
const complaints = [5, 4, 7, 3, 2, 2, 4, 1, 1, 3, 3, 2];
const ratingBuckets = [28, 76, 41];
const carbonByMode = { Local: 12, Ground: 38, Sea: 20, Air: 30 };

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const VendorsCharts: React.FC = () => {
  const lineOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 16, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: months, boundaryGap: false, axisLine:{ lineStyle:{ color:'#e5e7eb' } }, axisTick:{ show:false } },
    yAxis: { type: 'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
    series: [{ name:'Orders', type:'line', smooth:true, data: orders, areaStyle:{ color:'#11182722' }, lineStyle:{ color:'#111827', width:2 }, symbol:'circle', symbolSize:6, animationDuration:800 }],
  } as any;
  const pieOpt = {
    tooltip:{ trigger:'item', formatter:'{b}: {c} ({d}%)' }, legend:{ bottom:0, icon:'circle' },
    series:[{ type:'pie', radius:['58%','80%'], center:['50%','48%'], data:[{name:'A (≥85)', value:ratingBuckets[0]},{name:'B (70–85)', value:ratingBuckets[1]},{name:'C (<70)', value:ratingBuckets[2]}], itemStyle:{ borderColor:'#fff', borderWidth:2 }, label:{ show:false }, emphasis:{ scale:true } }],
  } as any;
  const barOpt = {
    tooltip:{ trigger:'axis', axisPointer:{ type:'shadow' } }, grid:{ left:24, right:16, top:16, bottom:28, containLabel:true },
    xAxis:{ type:'category', data:Object.keys(carbonByMode), axisTick:{ alignWithLabel:true }, axisLine:{ lineStyle:{ color:'#e5e7eb' } } }, yAxis:{ type:'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
    series:[{ type:'bar', data:Object.values(carbonByMode), itemStyle:{ color:'#10B981', borderRadius:[6,6,0,0] }, animationDuration:800 }]
  } as any;
  const dualOpt = {
    tooltip:{ trigger:'axis' }, legend:{ bottom:0 }, grid:{ left:24, right:16, top:16, bottom:28, containLabel:true },
    xAxis:{ type:'category', data:months, axisLine:{ lineStyle:{ color:'#e5e7eb' } } }, yAxis:[{ type:'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } }, { type:'value', min:60, max:100 }],
    series:[{ name:'Complaints', type:'bar', data:complaints, yAxisIndex:0, itemStyle:{ color:'#EF4444', borderRadius:[6,6,0,0] } }, { name:'On‑Time %', type:'line', data:onTime, yAxisIndex:1, smooth:true, lineStyle:{ color:'#3B82F6', width:2 }, areaStyle:{ color:'#3B82F633' } }]
  } as any;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={card}><div style={{ fontWeight:700, marginBottom:8 }}>Vendor Orders Trend (12m)</div><AsyncECharts option={lineOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
        <div style={card}><div style={{ fontWeight:700, marginBottom:8 }}>Ratings Distribution</div><AsyncECharts option={pieOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
        <div style={card}><div style={{ fontWeight:700, marginBottom:8 }}>Carbon Impact by Shipping Mode</div><AsyncECharts option={barOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={card}><div style={{ fontWeight:700, marginBottom:8 }}>On‑Time % vs Complaints (12m)</div><AsyncECharts option={dualOpt} style={{ height: 260 }} fallbackHeight={260} /></div>
      </div>
    </div>
  );
};

export default VendorsCharts;
