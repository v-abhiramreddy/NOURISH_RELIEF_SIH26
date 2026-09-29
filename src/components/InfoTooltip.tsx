'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface InfoTooltipProps {
  label: string;
  content: string | React.ReactNode;
  align?: 'left' | 'right' | 'center';
  position?: 'top' | 'bottom';
  className?: string;
}

export default function InfoTooltip({
  label,
  content,
  align = 'left',
  position = 'bottom',
  className = '',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  const isVisible = isOpen || isHovered || isFocused;

  // Tap or click outside to dismiss
  useEffect(() => {
    if (!isVisible) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsHovered(false);
        setIsFocused(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsHovered(false);
        setIsFocused(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  // Adjust for screen boundaries to prevent horizontal overflow
  const [xOffset, setXOffset] = useState<number>(0);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) {
      setXOffset(0);
      return;
    }

    const rect = tooltipRef.current.getBoundingClientRect();
    const margin = 12; // safe distance from window edge
    let offset = 0;

    if (rect.right > window.innerWidth - margin) {
      offset = window.innerWidth - margin - rect.right;
    } else if (rect.left < margin) {
      offset = margin - rect.left;
    }

    setXOffset(offset);
  }, [isVisible]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      setIsHovered(false);
      setIsFocused(false);
      buttonRef.current?.blur();
    } else {
      setIsOpen(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const positionClasses = position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';

  const alignClasses =
    align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  const arrowAlignClasses =
    align === 'right' ? 'right-2' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-2';

  const arrowPositionClasses =
    position === 'top'
      ? '-bottom-1 border-b border-r border-slate-700/80 bg-slate-900'
      : '-top-1 border-t border-l border-slate-700/80 bg-slate-900';

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${
        isVisible ? 'z-50' : 'z-auto'
      } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Information for ${label}`}
        aria-expanded={isVisible}
        aria-describedby={isVisible ? tooltipId : undefined}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand shrink-0 cursor-pointer"
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {isVisible && (
        <span
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={
            align === 'center'
              ? { transform: `translateX(calc(-50% + ${xOffset}px))` }
              : xOffset
              ? { transform: `translateX(${xOffset}px)` }
              : undefined
          }
          className={`absolute ${positionClasses} ${alignClasses} z-50 w-64 max-w-[calc(100vw-2rem)] sm:w-72 p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] sm:text-xs leading-relaxed font-normal normal-case not-italic tracking-normal text-left whitespace-normal break-words shadow-xl shadow-black/25 border border-slate-700/80 pointer-events-auto select-text`}
        >
          {/* Subtle pointer arrow */}
          <span
            className={`absolute ${arrowPositionClasses} ${arrowAlignClasses} w-2 h-2 rotate-45 pointer-events-none`}
            aria-hidden="true"
          />

          <span className="relative z-10 block">
            {typeof content === 'string' ? (
              content.split('\n\n').map((paragraph, idx) => (
                <span
                  key={idx}
                  className={`block ${
                    idx > 0
                      ? 'mt-1.5 pt-1.5 border-t border-slate-800 text-slate-300 dark:text-slate-400'
                      : ''
                  }`}
                >
                  {paragraph}
                </span>
              ))
            ) : (
              content
            )}
          </span>
        </span>
      )}
    </span>
  );
}
