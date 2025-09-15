import React from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useAssistant } from './useAssistant';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import AssistantModal from './AssistantModal';

export default function AssistantLauncher() {
  const { open, isOpen } = useAssistant();
  const { scrollYProgress } = useScroll();
  const yBob = useSpring(useTransform(scrollYProgress, [0, 1], [0, 6]), { stiffness: 80, damping: 15 });
  const [reduced, setReduced] = React.useState(false);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => setReduced(!!mq.matches);
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);

  const sizeCls = 'w-16 h-16 sm:w-16 sm:h-16';

  return (
    <>
      <motion.button
        aria-label="Open AI Assistant"
        onClick={() => open()}
        className={`fixed z-[55] bottom-4 right-4 sm:bottom-6 sm:right-6 ${sizeCls} rounded-full grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
        style={{
          boxShadow: cardTheme.shadow,
          y: yBob,
          background: 'transparent',
          rotateX: tiltX,
          rotateY: tiltY,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        onMouseMove={(e) => {
          if (reduced) return;
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const cx = r.left + r.width/2; const cy = r.top + r.height/2;
          const dx = (e.clientX - cx) / (r.width/2);
          const dy = (e.clientY - cy) / (r.height/2);
          tiltY.set(dx * 6);
          tiltX.set(-dy * 6);
        }}
        onMouseLeave={() => { tiltX.set(0); tiltY.set(0); }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,.06), rgba(255,255,255,.5))', boxShadow:'0 8px 24px rgba(0,0,0,.15)' }} />
        {/* Middle rotating conic gradient */}
        <div className="absolute inset-1 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-[-25%] rounded-full"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            style={{
              background: `conic-gradient(from 0deg, ${chartTheme.palette[0]}33, ${chartTheme.palette[1]}33, ${chartTheme.palette[2]}33, ${chartTheme.palette[0]}33)`
            }}
          />
        </div>
        {/* Scanning arc */}
        {!reduced && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,.6) 40deg, transparent 80deg)`,
              mixBlendMode: 'overlay'
            }}
          />
        )}
        {/* Inner core */}
        <motion.div
          className="absolute inset-2 rounded-full"
          animate={reduced ? undefined : { scale: [0.96, 1, 0.96], opacity: [0.9, 1, 0.9] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at 40% 40%, ${chartTheme.palette[0]}66, transparent 60%), radial-gradient(circle at 60% 60%, ${chartTheme.palette[1]}66, transparent 60%)`,
            filter: 'blur(2px)'
          }}
        />
        {/* Neon rim */}
        <div className="absolute inset-[2px] rounded-full" style={{ boxShadow: `0 0 14px ${chartTheme.palette[0]}55 inset, 0 0 18px ${chartTheme.palette[1]}33 inset` }} />
        {/* Sparks */}
        {!reduced && (
          <>
            <motion.span className="absolute w-1.5 h-1.5 rounded-full bg-white/90" style={{ top: '8%', left: '50%' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} />
            <motion.span className="absolute w-1 h-1 rounded-full bg-white/80" style={{ bottom: '12%', right: '16%' }} animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }} />
            <motion.span className="absolute w-1 h-1 rounded-full bg-white/70" style={{ top: '30%', right: '8%' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }} />
          </>
        )}
        {/* Center dot */}
        <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white/90 shadow" />
      </motion.button>

      {/* Modal (portaled) */}
      <AssistantModal />
    </>
  );
}
