import React from 'react';
import { Role } from '../types';

interface RoleIconProps {
  role: Role;
  className?: string;
  size?: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  top: 'Top',
  jgl: 'Jungle',
  mid: 'Mid',
  adc: 'ADC',
  sup: 'Support',
};

export const ROLE_ORDER: Role[] = ['top', 'jgl', 'mid', 'adc', 'sup'];

export const ROLE_ICON_SRC: Record<Role, string> = {
  top: '/role_icons/Top_icon.png',
  jgl: '/role_icons/Jungle_icon.png',
  mid: '/role_icons/Middle_icon.png',
  adc: '/role_icons/Bottom_icon.png',
  sup: '/role_icons/Support_icon.png',
};

export const RoleIcon: React.FC<RoleIconProps> = ({ role, className = '', size = 20 }) => {
  const src = ROLE_ICON_SRC[role];

  return (
    <img
      src={src}
      alt={ROLE_LABELS[role]}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`object-contain inline-block shrink-0 ${className}`}
      loading="eager"
    />
  );
};
