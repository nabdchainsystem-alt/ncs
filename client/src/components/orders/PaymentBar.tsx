import React from 'react';

export default function PaymentBar({ stages }: { stages: { pct: number; paid: boolean; label?: string }[] }) {
  const colors = ['#6EE7B7','#93C5FD','#FDE68A'];
  return (
    <div className="paybar" title={stages.map(s=>`${s.label||''} ${s.pct}% ${s.paid?'✓':''}`).join(' | ')}>
      {stages.map((s,i)=> (
        <div key={i} className="payseg" style={{ width: `${s.pct}%`, background: s.paid ? colors[i%colors.length] : '#E5E7EB' }} />
      ))}
    </div>
  );
}

