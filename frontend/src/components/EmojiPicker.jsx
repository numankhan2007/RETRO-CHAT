import React, { useState, useRef, useEffect } from 'react';
import Picker from 'emoji-picker-react';

export default function EmojiPicker({ textAreaRef, value, onChange, dropUp = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    
    if (!textAreaRef.current) {
      onChange(value + emoji);
      setIsOpen(false);
      return;
    }
    
    const el = textAreaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    onChange(`${before}${emoji}${after}`);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded border border-line bg-parchment-100"
      >
        🙂 Emoji
      </button>
      
      {isOpen && (
        <div className={`absolute left-0 z-50 shadow-lg rounded-md border border-line ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <Picker 
            onEmojiClick={onEmojiClick} 
            getEmojiUrl={(unified) => `/twemoji/svg/${unified}.svg`}
            emojiStyle="twemoji"
            theme="auto"
            skinTonesDisabled={false}
          />
        </div>
      )}
    </div>
  );
}
