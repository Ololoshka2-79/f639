import React from 'react';
import { motion } from 'framer-motion';

interface CheckoutHeaderProps {
  currentStep: number;
  totalSteps: number;
  onSelectStep?: (step: number) => void;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  currentStep,
  totalSteps,
  onSelectStep,
}) => {
  const steps = [
    { title: 'Контакты', n: 1 },
    { title: 'Доставка', n: 2 },
    { title: 'Подтверждение', n: 3 },
  ].slice(0, totalSteps);

  return (
    <div className="sticky top-0 z-40 border-b border-app-border/80 bg-app-bg/70 px-4 py-5 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center gap-1">
        {steps.map((step, index) => (
          <div key={step.title} className="relative flex flex-1 flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectStep?.(step.n)}
              className={`flex h-8 w-full max-w-[4.5rem] items-center justify-center rounded-full border text-[9px] font-semibold transition-all duration-200 ease-out ${
                currentStep === step.n
                  ? 'border-app-accent bg-app-accent text-app-bg'
                  : currentStep > step.n
                    ? 'border-app-accent/60 bg-app-accent/15 text-app-accent'
                    : 'border-app-border/80 bg-transparent text-app-text-muted'
              }`}
            >
              {step.n}
            </button>
            <span
              className={`max-w-[5rem] text-center text-[7px] font-semibold uppercase leading-tight tracking-wider transition-colors duration-200 ${
                currentStep >= step.n ? 'text-app-accent' : 'text-app-text-muted'
              }`}
            >
              {step.title}
            </span>

            {index < steps.length - 1 && (
              <div className="absolute left-[calc(50%+0.875rem)] top-4 z-0 h-px w-[calc(100%-1.75rem)] bg-app-border/40">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: currentStep > step.n ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="h-full origin-left bg-app-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
