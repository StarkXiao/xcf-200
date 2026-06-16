import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { RecipientGroup } from '@/types';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; description: string }) => void;
  editingGroup?: RecipientGroup | null;
}

const ICON_OPTIONS = [
  '🏠', '🤝', '💕', '🌟', '📚', '👨‍👩‍👧', '👩‍❤️‍👨',
  '🎮', '🎵', '🎨', '📖', '☕', '🌸', '🌙',
  '🚀', '⚡', '🌈', '🦋', '🌻', '🎯',
];

const COLOR_OPTIONS = [
  '#f72585', '#7209b7', '#5b3bff', '#4cc9f0',
  '#06d6a0', '#ffd166', '#ff7b00', '#ef476f',
  '#118ab2', '#073b4c', '#9b5de5', '#f15bb5',
];

export default function GroupModal({
  isOpen,
  onClose,
  onSave,
  editingGroup,
}: GroupModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#7a63ff');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      setIcon(editingGroup.icon);
      setColor(editingGroup.color);
      setDescription(editingGroup.description);
    } else {
      setName('');
      setIcon('📁');
      setColor('#7a63ff');
      setDescription('');
    }
    setErrors({});
  }, [editingGroup, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入分组名称';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      icon,
      color,
      description: description.trim(),
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
            {editingGroup ? '编辑分组' : '创建分组'}
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
              选择图标
            </label>
            <div className="grid grid-cols-10 gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-gradient-to-br from-cosmic-500/30 to-aurora/30 border-2 border-aurora/60 shadow-glow-sm scale-110'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-12 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`aspect-square rounded-xl transition-all ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-cosmic-950 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              分组名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：家人、挚友、恋人..."
              maxLength={15}
              className={`input-field ${errors.name ? 'border-red-400/50' : ''}`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
              <span>分组描述</span>
              <span className="text-xs text-white/40">{description.length}/50</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 50))}
              rows={2}
              placeholder="简单描述一下这个分组..."
              className="input-field resize-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 mb-2">预览效果</p>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: `${color}20`, color }}
            >
              <span>{icon}</span>
              <span className="text-sm font-medium">{name || '分组名称'}</span>
            </div>
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
            {editingGroup ? '保存修改' : '创建分组'}
          </button>
        </div>
      </div>
    </div>
  );
}
