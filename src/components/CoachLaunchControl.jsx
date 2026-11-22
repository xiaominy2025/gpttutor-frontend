import React, { forwardRef, useId, useState } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// One presentation for navigation, authenticated form submission and the existing modal.
const CoachLaunchControl = forwardRef(function CoachLaunchControl({ label, href, ...props }, ref) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const Control = href ? 'a' : 'button';
  return <span className="engent-launch" data-tooltip-dismissed={dismissed ? 'true' : undefined}
    onMouseEnter={() => setDismissed(false)} onFocusCapture={() => setDismissed(false)}
    onKeyDown={event => { if (event.key === 'Escape') setDismissed(true); }}>
    <Control {...(!href ? { type: 'button' } : {})} {...props} href={href} ref={ref}
      className="engent-launch-control" aria-label={label}>
      <ArrowTopRightOnSquareIcon aria-hidden="true" />
    </Control>
    <span className="engent-launch-tooltip" id={id} role="tooltip">{label}</span>
  </span>;
});
export default CoachLaunchControl;
