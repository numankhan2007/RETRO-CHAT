import React from 'react';
import twemoji from '@twemoji/api';

export const toStylishText = (text) => {
  const stylishMap = {
    'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊', 'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍',
    'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑', 'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗',
    'U': '𝔘', 'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ',
    'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤', 'h': '𝔥', 'i': '𝔦', 'j': '𝔧',
    'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫', 'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱',
    'u': '𝔲', 'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷'
  };
  return text.split('').map(c => stylishMap[c] || c).join('');
};

const escapeHtml = (unsafe) => {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderWithEmojis = (text) => {
  const safeText = escapeHtml(text);
  const htmlWithEmoji = twemoji.parse(safeText, { 
    folder: 'svg', 
    ext: '.svg', 
    base: '/twemoji/' 
  });
  return <span dangerouslySetInnerHTML={{ __html: htmlWithEmoji }} />;
};

export const stripFormatting = (text) => {
  if (!text) return "";
  // Strip simple HTML tags
  let stripped = text.replace(/<[^>]*>/g, '');
  // Strip simple markdown characters (*, _, ~, `)
  stripped = stripped.replace(/[*_~`]/g, '');
  // Strip links [text](url) to just text
  stripped = stripped.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return stripped.trim();
};

export const renderFormattedText = (text) => {
  if (!text) return null;
  
  // Basic parser for both markdown-like syntax and simple HTML tags
  const parts = text.split(/(<b>.*?<\/b>|<i>.*?<\/i>|<u>.*?<\/u>|<s>.*?<\/s>|<code>.*?<\/code>|\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`|\[[^\]]+\]\([^)]+\)|(?:^|\n)>[^\n]+(?:$|\n)|(?:^|\n)-[^\n]+(?:$|\n)|(?:^|\n)\d+\.[^\n]+(?:$|\n))/g);
  
  return parts.map((part, i) => {
    if (!part) return null;
    
    // HTML Tags
    if (part.startsWith('<b>') && part.endsWith('</b>')) return <strong key={i}>{renderFormattedText(part.slice(3, -4))}</strong>;
    if (part.startsWith('<i>') && part.endsWith('</i>')) return <em key={i}>{renderFormattedText(part.slice(3, -4))}</em>;
    if (part.startsWith('<u>') && part.endsWith('</u>')) return <u key={i}>{renderFormattedText(part.slice(3, -4))}</u>;
    if (part.startsWith('<s>') && part.endsWith('</s>')) return <del key={i}>{renderFormattedText(part.slice(3, -4))}</del>;
    if (part.startsWith('<code>') && part.endsWith('</code>')) return <code key={i} className="bg-black/10 px-1 rounded">{renderFormattedText(part.slice(6, -7))}</code>;
    
    // Markdown
    if (part.startsWith('*') && part.endsWith('*')) return <strong key={i}>{renderFormattedText(part.slice(1, -1))}</strong>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={i}>{renderFormattedText(part.slice(1, -1))}</em>;
    if (part.startsWith('~') && part.endsWith('~')) return <del key={i}>{renderFormattedText(part.slice(1, -1))}</del>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-black/10 px-1 rounded">{renderFormattedText(part.slice(1, -1))}</code>;
    
    // Links [text](url)
    if (part.match(/^\[(.*)\]\((.*)\)$/)) {
      const match = part.match(/^\[(.*)\]\((.*)\)$/);
      // XSS Prevention: ensure URL is safe
      const url = match[2].replace(/"/g, '%22');
      const isSafeUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
      return <a key={i} href={isSafeUrl ? url : '#'} target="_blank" rel="noopener noreferrer" className="underline font-bold opacity-90 hover:opacity-100">{renderFormattedText(match[1])}</a>;
    }

    // Quotes > text
    if (part.trim().startsWith('>')) {
      return <blockquote key={i} className="border-l-4 border-current pl-2 italic my-1 opacity-80">{renderFormattedText(part.replace(/(^|\n)>/g, '').trim())}</blockquote>;
    }

    // Bullet Lists - text
    if (part.trim().startsWith('-')) {
      return <ul key={i} className="list-disc pl-5 my-1"><li>{renderFormattedText(part.replace(/(^|\n)-/g, '').trim())}</li></ul>;
    }

    // Numbered Lists 1. text
    if (part.trim().match(/^\d+\./)) {
      return <ol key={i} className="list-decimal pl-5 my-1"><li>{renderFormattedText(part.replace(/(^|\n)\d+\./g, '').trim())}</li></ol>;
    }
    
    return <React.Fragment key={i}>{renderWithEmojis(part)}</React.Fragment>;
  });
};
