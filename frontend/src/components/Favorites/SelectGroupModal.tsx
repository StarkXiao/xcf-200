import { useState } from 'react';
import { X, Check, Plus, BookmarkPlus, FolderOpen } from 'lucide-react';
import type { GroupWithCount } from '@/api/favorites';

interface SelectGroupModalProps {
  open: boolean;
  onClose: () => void;
  groups: GroupWithCount[];
  ungroupedCount: number;
  currentGroupId?: string | null;
  onSelect: (groupId: string | null) => void;
  onCreateNew: () => void;
}

export default function SelectGroupModal({
  open,
  onClose,
  groups,
  ungroupedCount,
  currentGroupId,
  onSelect,
  onCreateNew
}: SelectGroupModalProps) {
  const [selectedId, setSelectedId] = useState<string | null | undefined>(currentGroupId);

  if (!open) return null;

  const handleConfirm = () => {
    onSelect(selectedId ?? null);
    onClose();
  };

  const allGroups = [
    { id: null, name: '未分组', icon: '📁', color: 'white', count: ungroupedCount },
    ...groups
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-aurora" />
            选择收藏分组
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-1">
          {allGroups.map((group) => {
            const isSelected = selectedId === group.id;
            return (
              <button
                key={group.id ?? 'ungrouped'}
                type="button"
                onClick={() => setSelectedId(group.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'bg-aurora/15 border-aurora/40'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{group.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{group.name}</div>
                  <div className="text-xs text-white/50">{group.count} 封信件</div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-aurora shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            className="btn-secondary flex items-center justify-center gap-2 px-4"
          >
            <Plus className="w-4 h-4" />
            新建分组
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <BookmarkPlus className="w-4 h-4" />
            确认收藏
          </button>
        </div>
      </div>
    </div>
  );
}
