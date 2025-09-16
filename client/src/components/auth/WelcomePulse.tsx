import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const LABEL_VISIBLE_MS = 2400;
const FADE_OUT_MS = 450;

type Phase = 'pulse' | 'label' | 'fade';

type WelcomePulseProps = {
  message: string;
  onComplete: () => void;
};

export default function WelcomePulse({ message, onComplete }: WelcomePulseProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'label' : 'pulse');
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (labelTimer.current) clearTimeout(labelTimer.current);
      if (completeTimer.current) clearTimeout(completeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'label') {
      if (labelTimer.current) clearTimeout(labelTimer.current);
      if (completeTimer.current) clearTimeout(completeTimer.current);
      labelTimer.current = setTimeout(() => {
        setPhase('fade');
        completeTimer.current = setTimeout(() => {
          onComplete();
        }, FADE_OUT_MS);
      }, LABEL_VISIBLE_MS);
    } else if (phase === 'pulse') {
      // Guard for users with reduced motion toggled after mount
      if (reducedMotion) {
        setPhase('label');
      }
    }
  }, [phase, onComplete, reducedMotion]);

  const handlePulseEnd = React.useCallback(() => {
    setPhase('label');
  }, []);

  return (
    <div className="pointer-events-none flex justify-center" role="status" aria-live="polite">
      {phase === 'pulse' ? (
        <span
          className="welcome-pulse-inline"
          onAnimationEnd={handlePulseEnd}
        >
          <span className="welcome-pulse-core">Welcome</span>
        </span>
      ) : (
        <span
          className={`welcome-label ${phase === 'fade' ? 'welcome-label--fade' : ''}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
