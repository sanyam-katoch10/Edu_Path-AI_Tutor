import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'prose prose-invert max-w-none text-[#E2DFD6]',
          'prose-headings:font-bold prose-headings:text-[#FFFDF7] prose-headings:tracking-tight',
          'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
          'prose-p:leading-relaxed prose-p:my-2.5 prose-p:text-[#E2DFD6]',
          'prose-strong:text-[#FFFDF7] prose-strong:font-semibold',
          'prose-code:text-[#95D5B2] prose-code:bg-[#10261C] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:border prose-code:border-[#52B788]/20 prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs',
          'prose-ul:my-2 prose-li:my-1 prose-li:text-[#E2DFD6]',
          'prose-blockquote:border-l-[#52B788] prose-blockquote:bg-[#10261C]/60 prose-blockquote:py-1.5 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:text-[#95D5B2]',
          className
        )
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
