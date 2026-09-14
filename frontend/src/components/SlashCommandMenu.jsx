import React from 'react';

const FORMATTING_OPTIONS = [
  { label: 'Bold', syntax: '*text*' },
  { label: 'Italic', syntax: '_text_' },
  { label: 'Underline', syntax: '<u>text</u>' },
  { label: 'Strikethrough', syntax: '~text~' },
  { label: 'Code', syntax: '`text`' },
  { label: 'Quote', syntax: '> text' },
  { label: 'Link', syntax: '[text](url)' },
  { label: 'Bullet List', syntax: '- text' },
  { label: 'Numbered List', syntax: '1. text' },
  { label: 'Stylish Text', syntax: '/stylish text' }
];

export default function SlashCommandMenu({ onSelect }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-parchment-050 border border-accent-900 rounded-md shadow-lg z-50 p-2 text-sm font-mono flex flex-col gap-1 w-64">
      <div className="text-xs text-accent-500 mb-1 border-b border-accent-300 pb-1">FORMATTING</div>
      {FORMATTING_OPTIONS.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(opt.syntax)}
          className="text-left flex justify-between hover:bg-accent-300 px-2 py-1 rounded"
        >
          <span>{opt.label}</span>
          <span className="text-accent-500 text-xs ml-2 opacity-70">{opt.syntax}</span>
        </button>
      ))}
    </div>
  );
}
