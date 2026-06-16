import { Mail, Calendar, Edit3, Trash2 } from 'lucide-react';
import type { RecipientRelation, RecipientGroup } from '@/types';
import { formatDate } from '@/utils/helpers';

interface RecipientCardProps {
  recipient: RecipientRelation & { group?: RecipientGroup };
  onEdit?: (recipient: RecipientRelation) => void;
  onDelete?: (id: string) => void;
  onClick?: (recipient: RecipientRelation) => void;
  rank?: number;
}

export default function RecipientCard({
  recipient,
  onEdit,
  onDelete,
  onClick,
  rank,
}: RecipientCardProps) {
  return (
    <div
      onClick={() => onClick?.(recipient)}
      className="glass-card p-5 relative overflow-hidden group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      {rank !== undefined && rank <= 3 && (
        <div className="absolute -top-1 -right-1 w-10 h-10 flex items-center justify-center">
          <span className="text-2xl animate-float">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-glow-sm"
          style={{
            background: `linear-gradient(135deg, ${recipient.group?.color || '#7a63ff'}33, ${recipient.group?.color || '#7a63ff'}11)`,
            border: `2px solid ${recipient.group?.color || '#7a63ff'}44`,
          }}
        >
          {recipient.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-serif-sc font-semibold text-white truncate">
              {recipient.name}
            </h4>
            {recipient.group && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: `${recipient.group.color}20`,
                  color: recipient.group.color,
                }}
              >
                <span>{recipient.group.icon}</span>
                {recipient.group.name}
              </span>
            )}
          </div>

          {recipient.note && (
            <p className="text-sm text-white/50 mb-3 line-clamp-1 font-serif-sc italic">
              「{recipient.note}」
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-aurora" />
              {recipient.letterCount} 封信
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-starlight" />
              {formatDate(recipient.lastWrittenAt)}
            </span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipient);
                }}
                className="p-2 rounded-lg text-white/40 hover:text-aurora hover:bg-aurora/10 transition-all"
                title="编辑"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipient.id);
                }}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
