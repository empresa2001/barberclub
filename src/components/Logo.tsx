'use client';

import { Scissors } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'compact';
}

export default function Logo({ 
  size = 'md', 
  className = '',
  variant = 'default'
}: LogoProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      iconContainer: 'p-2',
      icon: 'h-5 w-5',
      title: 'text-xl'
    },
    md: {
      iconContainer: 'p-3 lg:p-4',
      icon: 'h-7 w-7 lg:h-8 lg:w-8',
      title: 'text-3xl lg:text-4xl'
    },
    lg: {
      iconContainer: 'p-4 lg:p-6',
      icon: 'h-10 w-10 lg:h-12 lg:w-12',
      title: 'text-4xl lg:text-5xl'
    },
    xl: {
      iconContainer: 'p-6',
      icon: 'h-12 w-12 lg:h-16 lg:w-16',
      title: 'text-5xl lg:text-6xl'
    }
  };

  const config = sizeConfig[size];

  const LogoContent = () => (
    <div className={`flex items-center ${variant === 'compact' ? 'space-x-2' : 'space-x-4'} group cursor-pointer ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-barbershop-red/30 to-barbershop-blue/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
        <div className={`relative bg-gradient-to-br from-barbershop-red to-red-600 ${config.iconContainer} rounded-full group-hover:scale-110 transition-transform duration-500`}>
          <Scissors className={`${config.icon} text-white transform group-hover:rotate-12 transition-transform duration-500`} />
        </div>
      </div>
      <div className="space-y-0">
        <h1 className={`${config.title} font-black text-white tracking-tight leading-none`}>
          Barber<span className="bg-gradient-to-r from-barbershop-red to-red-500 bg-clip-text text-transparent">Club</span>
        </h1>
      </div>
    </div>
  );

  // Si es variant compact, no envolver en Link
  if (variant === 'compact') {
    return <LogoContent />;
  }

  return (

      <LogoContent />

  );
}
