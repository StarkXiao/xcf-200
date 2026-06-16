import { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import type { FavoriteGroup } from '@/types';

interface GroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; color: string; description: string }) => Promise<void>;
  editingGroup?: FavoriteGroup | null;
}

const iconOptions = ['⭐', '💖', '🔥', '🌙', '🌈', '📚', '🎨', '🌸', '🦋', '🌊', '☕', '🎵', '🍀', '🔮', '🌌', '💫'];
const colorOptions = [
  { key: 'starlight', label: '星光', class: 'bg-starlight/30 border-starlight/50' },
  { key: 'aurora', label: '极光', class: 'bg-aurora/30 border-aurora/50' },
  { key: 'nebula-pink', label: '星云粉', class: 'bg-nebula-pink/30 border-nebula-pink/50' },
  { key: 'nebula-purple', label: '星云紫', class: 'bg-nebula-purple/30 border-nebula-purple/50' },
  { key: 'nebula-mint', label: '星云薄荷', class: 'bg-nebula-mint/30 border-nebula-mint/50' },
  { key: 'nebula-orange', label: '星云橙', class: 'bg-nebula-orange/30 border-nebula-orange/50' },
];

export default function GroupModal({ open, onClose, onSubmit, editingGroup }: GroupModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('starlight');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      setIcon(editingGroup.icon);
      setColor(editingGroup.color);
      setDescription(editingGroup.description);
    } else {
      setName('');
      setIcon('⭐');
      setColor('starlight');
      setDescription('');
    }
  }, [editingGroup, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit({ name: name.trim(), icon, color, description: description.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-aurora" />
            {editingGroup ? '编辑分组' : '新建收藏分组'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">分组名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="给这个分组起个名字..."
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">选择图标</label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setIcon(ico)}
                  className={`aspect-square rounded-xl text-xl sm:text-2xl flex items-center justify-center transition-all ${
                    icon === ico
                      ? 'bg-gradient-to-br from-cosmic-500/30 to-aurora/30 border-2 border-aurora/60 shadow-glow-sm scale-110'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">选择主题色</label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    color === c.key
                      ? `${c.class} shadow-glow-sm`
                      : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
              <span>分组描述（选填）</span>
              <span className="text-xs text-white/40">{description.length}/50</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 50))}
              rows={2}
              placeholder="简单描述这个分组的用途..."
              className="input-field resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingGroup ? '保存修改' : '创建分组'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
