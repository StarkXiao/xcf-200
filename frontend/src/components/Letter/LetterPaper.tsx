import { useEffect, useState } from 'react';
import { EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import type { Letter } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { formatFullDate, getRecipientTypeLabel } from '@/utils/helpers';

interface LetterPaperProps {
  letter: Letter;
}

export default function LetterPaper({ letter }: LetterPaperProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const recipientType = getRecipientTypeLabel(letter.recipientType);

  if (letter.isRemoved) {
    return (
      <div className="paper-card shadow-paper-lg overflow-hidden animate-scale-in">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-nebula-pink via-nebula-orange to-nebula-pink" />
        <div className="relative pt-24 sm:pt-20 px-6 sm:px-10 pb-16 sm:pb-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-nebula-pink/10 flex items-center justify-center">
            <Trash2 className="w-10 h-10 text-nebula-pink" />
          </div>
          <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-cosmic-900 mb-3">
            信件已被删除
          </h2>
          <p className="text-sm text-cosmic-700/70 mb-2">
            该信件因违反社区规范已被永久删除
          </p>
          {letter.removedReason && (
            <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-nebula-pink/5 border border-nebula-pink/20">
              <p className="text-xs text-cosmic-800/60 mb-1">删除原因</p>
              <p className="text-sm text-cosmic-800 font-medium">{letter.removedReason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (letter.isHidden) {
    return (
      <div className="paper-card shadow-paper-lg overflow-hidden animate-scale-in">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-aurora via-nebula-purple to-aurora" />
        <div className="relative pt-24 sm:pt-20 px-6 sm:px-10 pb-16 sm:pb-20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-aurora/10 flex items-center justify-center">
              <EyeOff className="w-10 h-10 text-aurora" />
            </div>
            <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-cosmic-900 mb-3">
              信件已被隐藏
            </h2>
            <p className="text-sm text-cosmic-700/70">
              该信件因违反社区规范已被暂时隐藏
            </p>
            {letter.hiddenReason && (
              <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-aurora/5 border border-aurora/20">
                <p className="text-xs text-cosmic-800/60 mb-1">隐藏原因</p>
                <p className="text-sm text-cosmic-800 font-medium">{letter.hiddenReason}</p>
              </div>
            )}
          </div>

          <div className="mb-6 sm:mb-8 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${recipientType.color}`}>
              <span>{recipientType.icon}</span>
              <span>致 · {recipientType.label}的{letter.recipient}</span>
            </div>

            <h1 className="font-serif-sc text-2xl sm:text-3xl lg:text-4xl font-bold text-cosmic-900 leading-tight">
              {letter.title}
            </h1>
          </div>

          <div className="flex items-center justify-between mb-8 pb-6 border-b border-dashed border-cosmic-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-100 to-cosmic-200 flex items-center justify-center text-xl">
                {letter.senderName === '匿名星人' ? '🙈' : '✍️'}
              </div>
              <div>
                <div className="text-sm font-medium text-cosmic-900">{letter.senderName}</div>
                <div className="text-xs text-cosmic-700/60">{formatFullDate(letter.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-cosmic-900/5 border border-dashed border-cosmic-900/15">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-aurora shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-cosmic-800 mb-1">内容已隐藏</p>
                <p className="text-xs text-cosmic-700/60">该信件内容因违反社区规范无法展示。如果您对此有疑问，可以联系管理员。</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-dashed border-cosmic-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {letter.emotions.map((emo) => (
                  <EmotionTag key={emo} name={emo} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let currentIndex = 0;
    const content = letter.content;

    const timer = setInterval(() => {
      if (currentIndex < content.length) {
        const batchSize = Math.min(3, content.length - currentIndex);
        currentIndex += batchSize;
        setDisplayedContent(content.slice(0, currentIndex));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [letter.content]);

  return (
    <div className="paper-card shadow-paper-lg overflow-hidden animate-scale-in">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-nebula-purple via-cosmic-400 to-aurora" />

      <div className="absolute top-6 left-6 w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink to-starlight shadow-lg flex items-center justify-center opacity-90">
        <span className="text-3xl">💌</span>
      </div>

      <div className="absolute top-8 right-8 hidden sm:block">
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-starlight/90 to-nebula-pink/90 shadow-md flex items-center justify-center transform rotate-[-8deg]">
          <span className="text-4xl">{recipientType.icon}</span>
        </div>
      </div>

      <div className="relative pt-32 sm:pt-24 px-6 sm:px-10 pb-10 sm:pb-14">
        <div className="mb-6 sm:mb-8 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${recipientType.color}`}>
            <span>{recipientType.icon}</span>
            <span>致 · {recipientType.label}的{letter.recipient}</span>
          </div>

          <h1 className="font-serif-sc text-2xl sm:text-3xl lg:text-4xl font-bold text-cosmic-900 leading-tight">
            {letter.title}
          </h1>
        </div>

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-dashed border-cosmic-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-100 to-cosmic-200 flex items-center justify-center text-xl">
              {letter.senderName === '匿名星人' ? '🙈' : '✍️'}
            </div>
            <div>
              <div className="text-sm font-medium text-cosmic-900">{letter.senderName}</div>
              <div className="text-xs text-cosmic-700/60">{formatFullDate(letter.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="font-serif-sc text-base sm:text-lg leading-loose text-cosmic-800 whitespace-pre-line min-h-[200px]">
          {displayedContent}
          {isTyping && (
            <span className="inline-block w-2 h-6 ml-1 bg-cosmic-400 animate-pulse align-middle" />
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-dashed border-cosmic-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {letter.emotions.map((emo) => (
                <EmotionTag key={emo} name={emo} />
              ))}
            </div>

            <div className="relative flex justify-end">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-xl flex items-center justify-center transform rotate-[-5deg]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-300/60 flex items-center justify-center">
                  <span className="text-white font-serif-sc text-sm sm:text-base font-bold">星邮局</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-br from-transparent via-transparent to-paper-dark/70 rounded-tr-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-bl from-transparent via-transparent to-paper-dark/70 rounded-tl-2xl" />
    </div>
  );
}
