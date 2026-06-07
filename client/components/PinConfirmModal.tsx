'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PinConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'safe' | 'stop';
}

export default function PinConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  variant = 'stop',
}: PinConfirmModalProps) {
  const [pin, setPin] = useState('');

  const handleConfirm = () => {
    onConfirm(pin);
    setPin('');
  };

  const handleCancel = () => {
    setPin('');
    onCancel();
  };

  const confirmColor = variant === 'safe' ? '#0B3D2E' : '#C53A2D';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(21,21,21,0.36)' }}
            onClick={handleCancel}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-sm glass rounded-3xl p-6"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <h3 className="text-lg font-bold mb-1" style={{ color: '#151515' }}>{title}</h3>
            <p className="text-sm text-muted mb-5">{description}</p>

            <div className="mb-4">
              <label className="text-xs text-muted tracking-wide uppercase mb-2 block">
                Security PIN (if set)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 rounded-xl text-center text-xl tracking-widest font-mono outline-none"
                style={{
                  color: '#151515',
                  background: '#F7F4EE',
                  border: '1px solid #E7E0D7',
                  caretColor: confirmColor,
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted transition-all active:scale-95"
                style={{ background: '#FFFFFF', border: '1px solid #E7E0D7', color: '#6B6B6B' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: confirmColor }}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
