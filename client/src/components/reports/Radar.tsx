import React, { useEffect, useRef } from 'react';
import { useReports } from '../../context/ReportsContext';
import '../../styles/reports.css';

const Radar: React.FC = () => {
  const { kpis } = useReports();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(()=>{
    const cvs = canvasRef.current!; const ctx = cvs.getContext('2d')!; let raf:number; let t=0;
    const draw=()=>{ const W=cvs.width=cvs.clientWidth; const H=cvs.height=cvs.clientHeight; ctx.clearRect(0,0,W,H); ctx.fillStyle='rgba(2,6,23,.95)'; ctx.fillRect(0,0,W,H); const cx=W/2, cy=H/2; const r=Math.min(W,H)/2-20; const axes=[
      {label:'Spend',v:0.9}, {label:'Savings',v:kpis.savings/100}, {label:'OTD',v:kpis.otd/100}, {label:'Lead',v:1-kpis.lead/60}, {label:'Trust',v:kpis.trust/100}, {label:'Coverage',v:kpis.coverage/90}
    ];
    // rings
      ctx.strokeStyle='rgba(148,163,184,.25)'; for(let i=1;i<=4;i++){ ctx.beginPath(); ctx.arc(cx,cy,(r*i/4),0,Math.PI*2); ctx.stroke(); }
      // axes
      axes.forEach((a,i)=>{ const ang=(i/axes.length)*Math.PI*2 - Math.PI/2; const x=cx+Math.cos(ang)*r; const y=cy+Math.sin(ang)*r; ctx.strokeStyle='rgba(148,163,184,.2)'; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke(); ctx.fillStyle='#E5E7EB'; ctx.font='12px sans-serif'; ctx.fillText(a.label, cx+Math.cos(ang)*(r+10)-20, cy+Math.sin(ang)*(r+10)); });
      // radar shape
      ctx.beginPath(); axes.forEach((a,i)=>{ const ang=(i/axes.length)*Math.PI*2 - Math.PI/2; const f=0.4+0.6*(0.5+0.5*Math.sin(t+i)); const val=a.v*f; const x=cx+Math.cos(ang)*r*val; const y=cy+Math.sin(ang)*r*val; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.closePath(); ctx.fillStyle='rgba(59,130,246,.25)'; ctx.strokeStyle='rgba(59,130,246,.8)'; ctx.lineWidth=2; ctx.fill(); ctx.stroke();
      t+=0.02; raf=requestAnimationFrame(draw); };
    raf=requestAnimationFrame(draw); return ()=> cancelAnimationFrame(raf);
  },[kpis]);
  return <div className="rep-card" style={{ height: 260 }}><canvas ref={canvasRef} style={{ width:'100%', height:'100%' }} /></div>;
};

export default Radar;

