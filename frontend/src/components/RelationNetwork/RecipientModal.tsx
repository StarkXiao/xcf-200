import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { RecipientRelation, RecipientGroup } from '@/types';

interface RecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; groupId: string; avatar: string; note: string }) => void;
  groups: RecipientGroup[];
  editingRecipient?: RecipientRelation | null;
}

const AVATAR_OPTIONS = [
  '🌟', '💫', '✨', '🌙', '🌈', '🦋', '🌸', '🌊',
  '⭐', '🎨', '💕', '🏠', '👨‍👩‍👧', '👩‍❤️‍👨',
  '👨‍🏫', '👩‍🎓', '🧑‍🤝‍🧑', '🐱', '🐶', '🌻',
  '☕', '📚', '🎮', '🎵', '🚀', '⏰', '🌌',
];

export default function RecipientModal({
  isOpen,
  onClose,
  onSave,
  groups,
  editingRecipient,
}: RecipientModalProps) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [avatar, setAvatar] = useState('🌟');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecipient) {
      setName(editingRecipient.name);
      setGroupId(editingRecipient.groupId);
      setAvatar(editingRecipient.avatar);
      setNote(editingRecipient.note);
    } else {
      setName('');
      setGroupId(groups[0]?.id || '');
      setAvatar('🌟');
      setNote('');
    }
    setErrors({});
  }, [editingRecipient, groups, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入收信人名称';
    if (!groupId) newErrors.groupId = '请选择分组';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      groupId,
      avatar,
      note: note.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-card p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white">
            {editingRecipient ? '编辑收信人' : '添加收信人'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              选择头像
            </label>
            <div className="grid grid-cols-9 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                    avatar === av
                      ? 'bg-gradient-to-br from-cosmic-500/30 to-aurora/30 border-2 border-aurora/60 shadow-glow-sm scale-110'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              收信人名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：未来的自己、外婆、平行世界的Ta..."
              maxLength={30}
              className={`input-field ${errors.name ? 'border-red-400/50' : ''}`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              所属分组 <span className="text-red-400">*</span>
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className={`input-field ${errors.groupId ? 'border-red-400/50' : ''}`}
            >
              <option value="">请选择分组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.icon} {group.name}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="mt-1.5 text-xs text-red-400">{errors.groupId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
              <span>备注</span>
              <span className="text-xs text-white/40">{note.length}/80</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 80))}
              rows={2}
              placeholder="关于这个收信人的小备注..."
              className="input-field resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingRecipient ? '保存修改' : '添加收信人'}
          </button>
        </div>
      </div>
    </div>
  );
}
