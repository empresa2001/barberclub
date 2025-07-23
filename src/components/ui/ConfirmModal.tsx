import React from 'react';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'approve' | 'reject' | 'suspend' | 'reactivate';
  barbershopName?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  barbershopName,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'approve':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          confirmColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          confirmText: 'Aprobar',
        };
      case 'reject':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          confirmColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          confirmText: 'Rechazar',
        };
      case 'suspend':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          confirmColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
          confirmText: 'Suspender',
        };
      case 'reactivate':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          confirmColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          confirmText: 'Reactivar',
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-gray-400',
          confirmColor: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          confirmText: 'Confirmar',
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 shadow-2xl transition-all duration-300 animate-fade-in-up">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-4">
              <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-white text-center mb-2">
              {title}
            </h3>

            {/* Barbershop name highlight */}
            {barbershopName && (
              <div className="text-center mb-3">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 border border-white/20">
                  {barbershopName}
                </span>
              </div>
            )}

            {/* Message */}
            <p className="text-white/70 text-center text-sm leading-relaxed mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 ${config.confirmColor} text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  config.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
