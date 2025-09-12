import React, { useEffect, useRef, useState } from 'react';
import { useReports } from '../../context/ReportsContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/reports.css';

const Cinematic: React.FC = () => {
  const { cinematic, setCinematic, kpis, type } = useReports();
  const slides = [
    { title: 'Total Spend', value: `${kpis.spend.toLocaleString()} SAR` },
    { title: 'Savings', value: `${kpis.savings}%` },
    { title: 'On‑Time Delivery', value: `${kpis.otd}%` },
    { title: 'Lead Time', value: `${kpis.lead} days` },
  ];
  const [index, setIndex] = useState(0);
  useEffect(()=>{ if (!cinematic) return; const t = setInterval(()=> setIndex((i)=> (i+1)%slides.length), 2400); return ()=> clearInterval(t); }, [cinematic]);
  if (!cinematic) return null;
  return (
    <div className="cinema-wrap">
      <div className="cinema-stage">
        <div className="cinema-title">Cinematic Mode — {type}</div>
        <div className="cinema-btns">
          <button className="cinema-btn" onClick={()=> setIndex((i)=> (i-1+slides.length)%slides.length)}>Prev</button>
          <button className="cinema-btn" onClick={()=> setIndex((i)=> (i+1)%slides.length)}>Next</button>
          <button className="cinema-btn" onClick={()=> setCinematic(false)}>Close</button>
        </div>
        <div className="w-full h-full grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: -8 }} transition={{ duration: .5 }}>
              <div className="text-5xl font-extrabold text-white text-center drop-shadow">{slides[index].value}</div>
              <div className="text-center text-gray-300 mt-2">{slides[index].title}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="cinema-caption">Executive narration: KPIs updated in real-time — ready for presentation.</div>
      </div>
    </div>
  );
};

export default Cinematic;

