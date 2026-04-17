import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import { triggerHaptic } from '../../lib/telegramHaptics';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'gold', 
  fullWidth, 
  className, 
  onClick,
  ...props 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - radius}px`;
    ripple.style.top = `${e.clientY - rect.top - radius}px`;
    ripple.className = 'app-ripple';

    const existingRipple = button.getElementsByClassName('app-ripple')[0];
    if (existingRipple) {
      existingRipple.remove();
    }

    button.appendChild(ripple);
    
    // Cleanup ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);

    triggerHaptic('light');
    if (onClick) onClick(e);
  };

  const variantClasses = {
    gold: 'app-button-primary',
    outline: 'app-button-outline',
    ghost: 'text-luxury-secondary hover:text-app-accent hover:bg-white/5 transition-colors p-2'
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        variantClasses[variant],
        fullWidth && 'w-full',
        'relative overflow-hidden luxury-button',
        className
      )}
      onClick={handleRipple}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
