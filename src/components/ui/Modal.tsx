import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}

const Modal = ({ isOpen, onClose, title, size = 'md', children, className }: ModalProps) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto bg-gray-800 rounded-t-2xl shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-700 sm:p-6">
            <h2 className="text-lg font-semibold text-barbershop-white sm:text-xl">{title}</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-barbershop-white"
            >
              <X size={24} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={cn('p-4 sm:p-6', title && 'pt-0 sm:pt-0')}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
