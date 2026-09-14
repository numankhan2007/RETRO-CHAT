import React from 'react';
import Button from './Button';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-parchment-100 border border-accent-900 rounded shadow-[4px_4px_0_rgba(27,35,22,1)] max-w-sm w-full p-5 relative retro-slide-in">
        <h3 className="text-base font-bold text-accent-900 mb-2 font-mono border-b border-accent-900/20 pb-2">{title}</h3>
        <p className="text-ink mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
