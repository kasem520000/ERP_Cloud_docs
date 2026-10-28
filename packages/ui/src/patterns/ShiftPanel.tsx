import * as React from 'react';
export type Shift={ id:string; openingFloat:string; expectedAmount?:string; countedAmount?:string; status:'OPEN'|'CLOSED' };
export function ShiftPanel(props:{ shift:Shift; onClose?:(counted:string, expected:string)=>void; locale?:'ar'|'en' }): React.JSX.Element {
  const { shift, onClose, locale='en' } = props;
  const [counted,setCounted]=React.useState(shift.countedAmount??'');
  return (
    <div role="region" aria-label={locale==='ar'?'المناوبة':'Shift'} data-testid="shift-panel" dir={locale==='ar'?'rtl':'ltr'}>
      <span>Opening {shift.openingFloat}</span><span>Expected {shift.expectedAmount??'-'}</span>
      <input aria-label="counted" value={counted} onChange={e=>setCounted(e.target.value)} />
      <button onClick={()=>onClose?.(counted, shift.expectedAmount??'0')}>{locale==='ar'?'إغلاق':'Close'}</button>
    </div>
  );
}
