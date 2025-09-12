import React, { useEffect, useRef, useState } from 'react';
import { useOrders } from '../../context/OrdersContext';
import '../../styles/orders.css';

function lerp(a:number,b:number,t:number){ return a+(b-a)*t; }

const Hologram: React.FC = () => {
  const { view, riskLevel, toggleHologram } = useOrders();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rot, setRot] = useState({ ax: 0.4, ay: 0.5 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const last = useRef({x:0,y:0});

  useEffect(()=>{
    const cvs = canvasRef.current!; const ctx = cvs.getContext('2d')!;
    let raf:number; let t=0;
    const nodes = view.map((o,i)=> ({
      id:o.id,
      r: Math.max(4, Math.min(22, Math.sqrt(o.value)/25)),
      color: riskLevel(o)==='high'? 'rgba(239,68,68,0.9)': riskLevel(o)==='med'? 'rgba(245,158,11,0.9)': 'rgba(16,185,129,0.9)',
      x: Math.cos(i)*0.6 + Math.sin(i*1.7)*0.4,
      y: Math.sin(i*0.7)*0.6,
      z: Math.cos(i*1.3)*0.6,
    }));

    const stars = Array.from({length:120},(_,i)=>({ x: Math.random()*2-1, y: Math.random()*2-1, z: Math.random()*2-1, s: Math.random()*1.5+0.2 }));

    const draw = ()=>{
      const W = cvs.width = cvs.clientWidth; const H = cvs.height = cvs.clientHeight;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = 'rgba(2,6,23,0.9)'; ctx.fillRect(0,0,W,H);
      const cx = W/2, cy = H/2; const fov = 520 * zoom;
      // stars
      stars.forEach(s=>{ const x = s.x, y=s.y, z=s.z; const X = cx + (x*Math.cos(rot.ay)-z*Math.sin(rot.ay))*fov; const Z = (x*Math.sin(rot.ay)+z*Math.cos(rot.ay))+2; const Y = cy + (y*Math.cos(rot.ax)-(Z-2)*Math.sin(rot.ax))*fov; const scale = 0.0008/(0.5+Z*0.5); ctx.fillStyle='rgba(148,163,184,0.35)'; ctx.beginPath(); ctx.arc(X*scale, Y*scale, s.s, 0, Math.PI*2); ctx.fill(); });
      // links (simple neighbor links)
      ctx.lineWidth = 1;
      nodes.forEach((n,i)=>{
        const m = nodes[(i+1)%nodes.length];
        const p1 = project(n.x,n.y,n.z); const p2 = project(m.x,m.y,m.z);
        ctx.strokeStyle = 'rgba(59,130,246,0.35)'; ctx.beginPath(); ctx.moveTo(p1.X,p1.Y); ctx.lineTo(p2.X,p2.Y); ctx.stroke();
      });
      // nodes
      nodes.forEach(n=>{ const p = project(n.x,n.y,n.z); const rad = n.r*(0.6+p.Z*0.4); const grad = ctx.createRadialGradient(p.X,p.Y,1,p.X,p.Y,rad+6); grad.addColorStop(0,n.color); grad.addColorStop(1,'rgba(59,130,246,0.05)'); ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(p.X,p.Y,rad,0,Math.PI*2); ctx.fill(); });
      t+=0.01; raf=requestAnimationFrame(draw);
      function project(x:number,y:number,z:number){ const xr = x*Math.cos(rot.ay)-z*Math.sin(rot.ay); const zr = x*Math.sin(rot.ay)+z*Math.cos(rot.ay); const yr = y*Math.cos(rot.ax)-(zr)*Math.sin(rot.ax); const Z = (yr+2.2); const scale = fov/(fov+Z*300); return { X: cx + xr*280*scale, Y: cy + yr*280*scale, Z: scale } }
    };
    raf=requestAnimationFrame(draw); return ()=> cancelAnimationFrame(raf);
  },[view, riskLevel, rot, zoom]);

  const onDown = (e: React.MouseEvent)=>{ dragging.current=true; last.current={x:e.clientX,y:e.clientY}; };
  const onMove = (e: React.MouseEvent)=>{ if(!dragging.current) return; const dx=e.clientX-last.current.x; const dy=e.clientY-last.current.y; setRot(r=>({ ax: r.ax + dy*0.003, ay: r.ay + dx*0.003 })); last.current={x:e.clientX,y:e.clientY}; };
  const onUp = ()=>{ dragging.current=false; };

  return (
    <div className="holo-wrap" onMouseUp={onUp}>
      <div className="holo-canvas" onMouseDown={onDown} onMouseMove={onMove}>
        <div className="holo-toolbar">
          <button className="holo-btn" onClick={()=> setZoom(z=> Math.min(2.5, z+0.1))}>Zoom +</button>
          <button className="holo-btn" onClick={()=> setZoom(z=> Math.max(0.4, z-0.1))}>Zoom −</button>
          <button className="holo-btn" onClick={()=> setRot({ax:0.4,ay:0.5})}>Reset</button>
          <button className="holo-btn" onClick={toggleHologram}>Close</button>
        </div>
        <canvas ref={canvasRef} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>
  );
};

export default Hologram;

