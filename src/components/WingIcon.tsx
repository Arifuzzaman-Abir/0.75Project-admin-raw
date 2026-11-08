import React from 'react';
import { Code2 } from 'lucide-react';

export interface WingIconProps {
  slug: string;
  className?: string;
  isSelected?: boolean;
  forceWhite?: boolean;
}

export const WING_CUSTOM_ICONS: Record<string, { red: string; pink: string; white: string; label: string }> = {
  cyber_security: {
    red: '/assets/icons/cyber_security_red.png',
    pink: '/assets/icons/cyber_security_pink.png',
    white: '/assets/icons/cyber_security_white.png',
    label: 'Cyber Security'
  },
  research: {
    red: '/assets/icons/research_red.png',
    pink: '/assets/icons/research_pink.png',
    white: '/assets/icons/research_white.png',
    label: 'Research'
  },
  sports: {
    red: '/assets/icons/sports_red.png',
    pink: '/assets/icons/sports_pink.png',
    white: '/assets/icons/sports_white.png',
    label: 'Sports'
  },
  cultural: {
    red: '/assets/icons/cultural_red.png',
    pink: '/assets/icons/cultural_pink.png',
    white: '/assets/icons/cultural_white.png',
    label: 'Cultural'
  },
  tour: {
    red: '/assets/icons/tour_red.png',
    pink: '/assets/icons/tour_pink.png',
    white: '/assets/icons/tour_white.png',
    label: 'Tour & Picnic'
  }
};

export const WingIcon: React.FC<WingIconProps> = ({ 
  slug, 
  className = 'w-5 h-5', 
  isSelected = false,
  forceWhite = false
}) => {
  const isWhite = isSelected || forceWhite;
  const custom = WING_CUSTOM_ICONS[slug];

  if (custom) {
    if (isWhite) {
      return (
        <span className={`inline-flex items-center justify-center ${className} select-none pointer-events-none shrink-0`}>
          <img
            src={custom.white}
            alt={custom.label}
            className="w-full h-full object-contain"
            loading="eager"
          />
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center justify-center ${className} select-none pointer-events-none shrink-0`}>
        <img
          src={custom.red}
          alt={custom.label}
          className="w-full h-full object-contain dark:hidden"
          loading="eager"
        />
        <img
          src={custom.pink}
          alt={custom.label}
          className="w-full h-full object-contain hidden dark:block"
          loading="eager"
        />
      </span>
    );
  }

  // Programming Club default icon
  return <Code2 className={`${className} stroke-[2.2] ${isWhite ? 'text-white' : 'text-red-600 dark:text-red-400'}`} />;
};

interface WingBadgeIconProps {
  slug: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: string;
}

export const WingBadgeIcon: React.FC<WingBadgeIconProps> = ({
  slug,
  size = 'md',
  className = '',
  rounded
}) => {
  const sizeMap = {
    xs: { box: 'w-5 h-5', icon: 'w-3 h-3', defRound: 'rounded-md' },
    sm: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', defRound: 'rounded-lg' },
    md: { box: 'w-8 h-8', icon: 'w-4.5 h-4.5', defRound: 'rounded-xl' },
    lg: { box: 'w-10 h-10', icon: 'w-5 h-5', defRound: 'rounded-2xl' },
    xl: { box: 'w-12 h-12', icon: 'w-6 h-6', defRound: 'rounded-2xl' }
  }[size];

  const roundClass = rounded || sizeMap.defRound;

  return (
    <div className={`bg-[#FDF0F3] dark:bg-[#2C0A17] text-[#D40000] dark:text-[#E5486B] flex items-center justify-center shadow-xs shrink-0 transition-transform ${sizeMap.box} ${roundClass} ${className}`}>
      <WingIcon slug={slug} className={sizeMap.icon} />
    </div>
  );
};
