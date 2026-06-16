import { useState } from 'react';
import { X, Send, MessageSquare, Clock, User } from 'lucide-react';
import RiskLevelBadge from './RiskLevelBadge';
import type { Intervention, InterventionType, InterventionStatus } from '@/types';

interface InterventionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: Intervention | null;
  onAddRecord: (data: {
    type: string;
    content: string;
    status?: InterventionStatus;
    newType?: InterventionType;
  }) => void;
  operatorId: string;
}

const statusOptions: { value: InterventionStatus; label: string; color: string }[] = [
  { value: 'pending', label: '待处理', color: 'text-yellow-400' },
  { value: 'in_progress', label: '处理中', color: 'text-blue-400' },
  { value: 'resolved', label: '已解决', color: 'text-green-400' },
  { value: 'closed', label: '已关闭', color: 'text-gray-400' },
];

const typeOptions: { value: InterventionType; label: string; icon: string }[] = [
  { value: 'system_tip', label: '系统提示', icon: '🤖' },
  { value: 'peer_care', label: '同伴关怀', icon: '💝' },
  { value: 'resource_push', label: '资源推送', icon: '📚' },
  { value: 'human_intervention', label: '人工介入', icon: '👤' },
  { value: 'emergency', label: '紧急响应', icon: '🚨' },
];

const recordTypeOptions = [
  { value: 'note', label: '备注记录' },
  { value: 'contact', label: '联系记录' },
  { value: 'resource', label: '资源推送' },
  { value: 'followup', label: '跟进记录' },
];

export default function InterventionDetailModal({
  isOpen,
  onClose,
  intervention,
  onAddRecord,
  operatorId,
}: InterventionDetailModalProps) {
  const [newRecord, setNewRecord] = useState('');
  const [recordType, setRecordType] = useState('note');
  const [selectedStatus, setSelectedStatus] = useState<InterventionStatus | ''>('');
  const [selectedType, setSelectedType] = useState<InterventionType | ''>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !intervention) return null;

  const handleSubmit = async () => {
    if (!newRecord.trim()) return;

    setSubmitting(true);
    try {
      await onAddRecord({
        type: recordType,
        content: newRecord,
        status: selectedStatus || undefined,
        newType: selectedType || undefined,
      });
      setNewRecord('');
      setSelectedStatus('');
      setSelectedType('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-card rounded-3xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-aurora/20 flex items-center justify-center text-2xl">
              {typeOptions.find(t => t.value === intervention.type)?.icon || '📋'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {typeOptions.find(t => t.value === intervention.type)?.label || '干预记录'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <RiskLevelBadge level={intervention.riskLevel} size="sm" />
                <span className="text-xs text-white/50">
                  ID: {intervention.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">当前状态</p>
              <p className={`text-lg font-semibold ${statusOptions.find(s => s.value === intervention.status)?.color}`}>
                {statusOptions.find(s => s.value === intervention.status)?.label}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">优先级</p>
              <p className="text-lg font-semibold text-white">
                {intervention.priority === 'high' && '🔴 高'}
                {intervention.priority === 'medium' && '🟡 中'}
                {intervention.priority === 'low' && '🟢 低'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              干预记录 ({intervention.records.length})
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {intervention.records.map((record, index) => (
                <div
                  key={record.id}
                  className="bg-white/5 rounded-xl p-4 relative"
                >
                  {index < intervention.records.length - 1 && (
                    <div className="absolute left-6 top-full w-0.5 h-3 bg-white/10" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {record.operator === 'system' ? (
                        <span className="text-sm">🤖</span>
                      ) : (
                        <User className="w-4 h-4 text-white/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-aurora/20 text-aurora">
                          {recordTypeOptions.find(r => r.value === record.type)?.label || record.type}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{record.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white/80 mb-3">添加记录</h4>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {recordTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRecordType(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    recordType === opt.value
                      ? 'bg-aurora/30 text-aurora border border-aurora/50'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">变更状态</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as InterventionStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-aurora/50"
                >
                  <option value="">不更改</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">变更类型</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as InterventionType)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-aurora/50"
                >
                  <option value="">不更改</option>
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <textarea
                value={newRecord}
                onChange={(e) => setNewRecord(e.target.value)}
                placeholder="输入记录内容..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-aurora/50 resize-none h-20"
              />
              <button
                onClick={handleSubmit}
                disabled={!newRecord.trim() || submitting}
                className="px-4 py-2 rounded-xl bg-aurora hover:bg-aurora/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors self-end flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
