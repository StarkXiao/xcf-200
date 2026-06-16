import { Users, Edit3, Trash2 } from 'lucide-react';
import type { RecipientGroup } from '@/types';

interface GroupCardProps {
  group: RecipientGroup;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  onEdit?: (group: RecipientGroup) => void;
  onDelete?: (id: string) => void;
}

export default function GroupCard({
  group,
  count = 0,
  selected = false,
  onClick,
  onEdit,
  onDelete,
}: GroupCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-4 relative overflow-hidden group cursor-pointer transition-all duration-300 ${
        selected
          ? 'bg-white/15 border-white/30 shadow-glow-sm'
          : 'hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: group.color }} />

      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{
            background: `linear-gradient(135deg, ${group.color}33, ${group.color}11)`,
          }}
        >
          {group.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{group.name}</h4>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${group.color}20`,
                color: group.color,
              }}
            >
              {count}
            </span>
          </div>

          {group.description && (
            <p className="text-xs text-white/50 line-clamp-1">{group.description}</p>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
            <Users className="w-3 h-3" />
            <span>{count} 位收信人</span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-aurora hover:bg-aurora/10 transition-all"
                title="编辑分组"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group.id);
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="删除分组"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
