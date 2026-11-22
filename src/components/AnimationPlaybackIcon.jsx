import React from 'react';
import { ArrowPathIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function AnimationPlaybackIcon({ playing = false, ended = false }) {
  const Icon = playing ? PauseIcon : ended ? ArrowPathIcon : PlayIcon;
  return <Icon aria-hidden="true" />;
}
