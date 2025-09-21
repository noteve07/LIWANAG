// components/ui/TransitionWrapper.tsx
import { useState } from 'react';
import type { ReactNode } from 'react';

interface TransitionProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  pageTransition?: boolean;
  onClick?: () => void;
}

export default function TransitionWrapper({ 
  children, 
  className = "",
  hoverEffect = true,
  pageTransition = false,
  onClick
}: TransitionProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`
        transition-all duration-200
        ${hoverEffect && isHovered ? "shadow-lg transform -translate-y-1" : ""}
        ${pageTransition ? "animate-fadeIn" : ""}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => hoverEffect && setIsHovered(true)}
      onMouseLeave={() => hoverEffect && setIsHovered(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}