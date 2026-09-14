import React, { useRef } from 'react';
import Button from './Button';

export default function FormatToolbar({ textAreaRef, value, onChange }) {
  const applyFormat = (openTag, closeTag) => {
    if (!textAreaRef.current) return;
    const el = textAreaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    const before = value.substring(0, start);
    let selected = value.substring(start, end);
    const after = value.substring(end);
    
    let newValue;
    let newStart = start;
    let newEnd = end;

    if (selected.startsWith(openTag) && selected.endsWith(closeTag)) {
      // Toggle off around selection
      selected = selected.substring(openTag.length, selected.length - closeTag.length);
      newValue = `${before}${selected}${after}`;
      newStart = start;
      newEnd = start + selected.length;
    } else if (before.endsWith(openTag) && after.startsWith(closeTag)) {
      // Toggle off (cursor inside tags)
      newValue = `${before.substring(0, before.length - openTag.length)}${selected}${after.substring(closeTag.length)}`;
      newStart = start - openTag.length;
      newEnd = end - openTag.length;
    } else {
      // Toggle on
      newValue = `${before}${openTag}${selected}${closeTag}${after}`;
      newStart = start + openTag.length;
      newEnd = end + openTag.length;
    }
    
    onChange(newValue);
    
    // Attempt to restore focus/selection (setTimeout to wait for react state update)
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  return (
    <div className="flex gap-1 mb-1 p-1 bg-parchment-100 border border-line rounded-md">
      <button type="button" tabIndex="-1" onClick={() => applyFormat('<b>', '</b>')} className="font-bold px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded">B</button>
      <button type="button" tabIndex="-1" onClick={() => applyFormat('<i>', '</i>')} className="italic px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded">I</button>
      <button type="button" tabIndex="-1" onClick={() => applyFormat('<u>', '</u>')} className="underline px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded">U</button>
      <button type="button" tabIndex="-1" onClick={() => applyFormat('<s>', '</s>')} className="line-through px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded">S</button>
      <button type="button" tabIndex="-1" onClick={() => applyFormat('<code>', '</code>')} className="font-mono px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded">{"</>"}</button>
    </div>
  );
}
