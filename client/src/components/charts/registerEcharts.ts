import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, RadarChart, GaugeChart, ScatterChart, EffectScatterChart, HeatmapChart, SunburstChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  DatasetComponent,
  VisualMapComponent,
  CalendarComponent,
  ToolboxComponent,
  GraphicComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GaugeChart,
  ScatterChart,
  EffectScatterChart,
  HeatmapChart,
  SunburstChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  DatasetComponent,
  VisualMapComponent,
  CalendarComponent,
  ToolboxComponent,
  GraphicComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer,
]);

export { echarts };
