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

  const sizeCls = 'w-20 h-20 sm:w-20 sm:h-20';

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
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
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
        {/* Outer aura */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.2), rgba(248,250,252,0.65))',
            boxShadow: '0 18px 40px rgba(15,23,42,0.28)',
          }}
        />
        {/* Ambient glow */}
        <motion.div
          className="absolute inset-[-18%] rounded-full blur-2xl"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          style={{
            background: `conic-gradient(from 0deg, ${chartTheme.palette[0]}22, ${chartTheme.palette[1]}11, ${chartTheme.palette[2]}33, ${chartTheme.palette[0]}22)`
          }}
        />

        {/* Glass shell */}
        <div className="absolute inset-1 rounded-full overflow-hidden backdrop-blur-md bg-white/10">
          {/* Spiral nebula */}
          <motion.div
            className="absolute inset-[-45%] rounded-full"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${chartTheme.palette[0]}40 80deg, transparent 120deg, ${chartTheme.palette[1]}35 200deg, transparent 260deg)`
            }}
          />
          {/* Inner galaxy swirl */}
          <motion.div
            className="absolute inset-[-35%] rounded-full opacity-90"
            animate={reduced ? undefined : { rotate: -360 }}
            transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
            style={{
              background: `conic-gradient(from 90deg, ${chartTheme.palette[2]}33, transparent 120deg, ${chartTheme.palette[1]}33 200deg, transparent 320deg)`
            }}
          />
          {/* Star field */}
          {!reduced && (
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 0)',
                backgroundSize: '18px 18px',
                opacity: 0.55,
                mixBlendMode: 'screen',
              }}
            />
          )}
        </div>

        {/* Pulse rings */}
        {!reduced && (
          <>
            <motion.div
              className="absolute inset-1 rounded-full"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
              style={{ border: `1px solid ${chartTheme.palette[0]}55` }}
            />
            <motion.div
              className="absolute inset-3 rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 0.4 }}
              style={{ border: `1px solid ${chartTheme.palette[1]}44` }}
            />
          </>
        )}

        {/* Core orb */}
        <motion.div
          className="absolute inset-[18%] rounded-full"
          animate={reduced ? undefined : { scale: [0.94, 1.05, 0.94], rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${chartTheme.palette[0]}aa, transparent 62%),
                         radial-gradient(circle at 70% 65%, ${chartTheme.palette[2]}88, transparent 58%),
                         radial-gradient(circle at 40% 70%, rgba(255,255,255,0.6), transparent 55%)`,
            filter: 'blur(1.5px)'
          }}
        />

        {/* Stellar sparks */}
        {!reduced && (
          <>
            <motion.span className="absolute w-2 h-2 rounded-full bg-white/95" style={{ top: '10%', left: '48%' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 9, ease: 'linear' }} />
            <motion.span className="absolute w-1.5 h-1.5 rounded-full bg-white/85" style={{ bottom: '14%', right: '18%' }} animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 13, ease: 'linear' }} />
            <motion.span className="absolute w-1.5 h-1.5 rounded-full bg-white/80" style={{ top: '32%', right: '10%' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 21, ease: 'linear' }} />
            <motion.span className="absolute w-1 h-1 rounded-full bg-white/70" style={{ bottom: '22%', left: '16%' }} animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 17, ease: 'linear' }} />
          </>
        )}

        {/* Central light */}
        <div className="relative z-10 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
      </motion.button>

      {/* Modal (portaled) */}
      <AssistantModal />
    </>
  );
}
