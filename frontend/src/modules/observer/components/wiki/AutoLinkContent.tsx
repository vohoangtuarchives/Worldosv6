'use client';

import React from 'react';

interface AutoLinkContentProps {
  content: string;
  universeId: string;
  className?: string;
}

export default function AutoLinkContent({ content, universeId, className = '' }: AutoLinkContentProps) {
  // Component này nhận HTML từ backend đã được WikiEngineService gắn link
  // Và hiển thị nó với style của Wiki
  return (
    <div 
      className={`wiki-content prose max-w-none font-medium text-slate-600 ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target.classList.contains('wiki-link')) {
          // Xử lý chuyển hướng bằng router nếu cần (mặc định thẻ <a> vẫn hoạt động)
          console.log('Wiki Link Clicked:', target.dataset.type, target.dataset.id);
        }
      }}
    />
  );
}
