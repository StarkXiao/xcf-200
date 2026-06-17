import { useState } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';

interface RelayReplyFormProps {
  parentReplyId: string;
  parentSenderName?: string;
  onSubmit: (data: { content: string; emotion: string; senderName?: string }) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const emotions = ['温暖', '治愈', '希望', '思念', '神秘', '幸福', '勇气'];

export default function RelayReplyForm({
  parentSenderName,
  onSubmit,
  onCancel,
  submitting = false,
}: RelayReplyFormProps) {
  const [content, setContent] = useState('');
  const [senderName, setSenderName] = useState('');
  const [emotion, setEmotion] = useState('温暖');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit({
      content: content.trim(),
      emotion,
      senderName: senderName.trim() || undefined,
    });
    setContent('');
    setSenderName('');
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-aurora/30 bg-aurora/5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-aurora">
          <Sparkles className="w-4 h-4" />
          <span>接力回复 {parentSenderName ? `@${parentSenderName}` : ''}</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">你的署名（选填）</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="如：传递温暖的人"
            maxLength={20}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aurora/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">接力内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="延续这份情绪，写下你的回应..."
            rows={3}
            maxLength={500}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-2">选择你传递的情绪</label>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmotion(e)}
              >
                <EmotionTag
                  name={e}
                  size="sm"
                  selected={emotion === e}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-aurora/20 border border-aurora/40 text-aurora hover:bg-aurora/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? '传递中...' : '传递情绪'}
          </button>
        </div>
      </div>
    </div>
  );
}
