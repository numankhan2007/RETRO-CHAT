import React, { useState, useRef, memo } from 'react';
import { renderFormattedText } from '../utils/textUtils';
import Avatar from './Avatar';

const MessageBubble = ({ content, isMine, sender, timestamp, onReply, replyToMessage, onContextMenu, isPinned, isEdited, isDeleted }) => {
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef(null);
  const longPressTimer = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    
    // Set up long press timer
    longPressTimer.current = setTimeout(() => {
      if (onContextMenu) {
        onContextMenu({
          preventDefault: () => {},
          clientX: touch.clientX,
          clientY: touch.clientY
        });
      }
    }, 800);
  };

  const handleTouchMove = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    if (isMine && diff < 0) {
      setTranslateX(Math.max(diff, -60));
    } else if (!isMine && diff > 0) {
      setTranslateX(Math.min(diff, 60));
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (Math.abs(translateX) >= 40) {
      onReply();
    }
    setTranslateX(0);
    touchStartX.current = null;
  };

  return (
    <div 
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 group retro-slide-in select-none gap-2 items-end`}
      onContextMenu={onContextMenu}
    >
      {!isMine && sender && (
        <div className="shrink-0 mb-1">
          <Avatar url={sender.avatar_url} username={sender.username} size="sm" />
        </div>
      )}
      <div 
        className={`max-w-[70%] px-4 py-2 rounded-lg font-mono text-sm touch-pan-y
        ${translateX === 0 ? "transition-transform group-hover:-translate-y-0.5" : ""}
        ${isMine
          ? "bg-accent-800 text-cream rounded-br-sm"
          : "bg-parchment-050 text-ink border border-line rounded-bl-sm"}`}
        style={translateX ? { transform: `translateX(${translateX}px)` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isMine && sender && (
          <div className="text-[10px] font-bold text-accent-700 mb-1 truncate">{sender.name}</div>
        )}
        
        {replyToMessage && !isDeleted && (
          <div className="mb-2 p-2 border-l-2 border-current opacity-70 bg-black/5 rounded text-xs pointer-events-none">
            <span className="font-bold opacity-100">{replyToMessage.senderName}</span>
            <p className="truncate mt-1">{renderFormattedText(replyToMessage.content)}</p>
          </div>
        )}

        {isDeleted ? (
          <p className="whitespace-pre-wrap break-words italic text-sm opacity-70 flex items-center gap-2">
            🚫 This message was deleted
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words pointer-events-none">{renderFormattedText(content)}</p>
        )}
        <div className={`flex items-center justify-between text-[10px] mt-1 pointer-events-none ${isMine ? "text-cream/70" : "text-ink-muted"}`}>
          <span>{isPinned && !isDeleted && "📌"}</span>
          <span>{isEdited && !isDeleted && "(Edited) "}{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubble, (prevProps, nextProps) => {
  return prevProps.content === nextProps.content &&
         prevProps.isPinned === nextProps.isPinned &&
         prevProps.isEdited === nextProps.isEdited &&
         prevProps.isDeleted === nextProps.isDeleted &&
         prevProps.timestamp === nextProps.timestamp;
});
