import { useState, useEffect } from 'react';
import {
  History, RotateCcw, Clock, FileText, X, Check, AlertCircle
} from 'lucide-react';
import { draftsApi } from '@/api/drafts';
import useUIStore from '@/store/useUIStore';
import type { DraftVersion, DraftContentSnapshot } from '@/types';
import { formatDate } from '@/utils/helpers';

interface Props {
  draftId: string;
  open: boolean;
  onClose: () => void;
  onRestore?: (snapshot: DraftContentSnapshot) => void;
  onRestored?: () => void;
}

export default function DraftVersionHistory({ draftId, open, onClose, onRestore, onRestored }: Props) {
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(null);
  const [restoring, setRestoring] = useState(false);
  const { showToast } = useUIStore();

  useEffect(() => {
    if (open && draftId) {
      fetchVersions();
    }
  }, [open, draftId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await draftsApi.getVersions(draftId);
      if (res.success) setVersions(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: '加载版本历史失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: DraftVersion) => {
    if (!confirm(`确定要恢复到第 ${version.version} 版本吗？当前内容会作为新版本保存。`)) return;

    try {
      setRestoring(true);
      const res = await draftsApi.restoreVersion(draftId, version.id);
      if (res.success) {
        if (onRestore) {
          onRestore(version.snapshot);
        }
        showToast({ type: 'success', message: `已恢复到第 ${version.version} 版本` });
        setSelectedVersion(null);
        fetchVersions();
        if (onRestored) onRestored();
        onClose();
      } else {
        showToast({ type: 'error', message: res.message || '恢复失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '恢复失败' });
    } finally {
      setRestoring(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-aurora" />
            <h3 className="font-serif-sc text-xl font-semibold text-white">版本历史</h3>
            <span className="text-xs text-white/50">共 {versions.length} 个版本</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="border-r border-white/10 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-aurora/30 border-t-aurora rounded-full animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/50">
                <History className="w-12 h-12 mb-3 opacity-50" />
                <p>暂无版本记录</p>
                <p className="text-xs mt-1">保存草稿时会自动创建版本</p>
              </div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedVersion?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-aurora/10 border-aurora/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-aurora/20 text-aurora' : 'bg-white/10 text-white/60'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold text-sm ${
                              isSelected ? 'text-aurora' : 'text-white'
                            }`}>
                              v{v.version}
                            </span>
                            {v.note && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 truncate max-w-[150px]">
                                {v.note}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Clock className="w-3 h-3" />
                            {formatDate(v.createdAt)}
                          </div>
                          <p className="text-xs text-white/50 mt-1 truncate">
                            {v.snapshot?.title || '(无标题)'} · {(v.snapshot?.content?.length || 0)} 字
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(v);
                        }}
                        disabled={restoring}
                        className="shrink-0 p-2 rounded-lg bg-white/10 text-white/70 hover:bg-aurora/20 hover:text-aurora transition-all disabled:opacity-50"
                        title="恢复此版本"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="overflow-y-auto p-6">
            {selectedVersion ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif-sc text-lg font-semibold text-white mb-1">
                      v{selectedVersion.version} 预览
                    </h4>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(selectedVersion.createdAt)}
                      {selectedVersion.note && ` · ${selectedVersion.note}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={restoring}
                    className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    恢复此版本
                  </button>
                </div>

                <div className="paper-card p-5 rounded-xl">
                  <div className="border-b border-cosmic-900/20 pb-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-starlight/15 text-starlight">
                        致{selectedVersion.snapshot?.recipient || '(收件人)'}
                      </span>
                      {selectedVersion.snapshot?.scheduledDelivery && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-aurora/15 text-aurora flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedVersion.snapshot.scheduledDate || '--'}
                        </span>
                      )}
                    </div>
                    <h5 className="font-serif-sc text-xl font-bold text-cosmic-900">
                      {selectedVersion.snapshot?.title || '(无标题)'}
                    </h5>
                  </div>
                  <div className="font-serif-sc text-sm leading-loose text-cosmic-800 whitespace-pre-line min-h-[120px]">
                    {selectedVersion.snapshot?.content || '(无内容)'}
                  </div>
                  {selectedVersion.snapshot?.emotions?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-cosmic-900/20 flex flex-wrap gap-2">
                      {selectedVersion.snapshot.emotions.map((e) => (
                        <span key={e} className="text-xs px-2 py-1 rounded-full bg-nebula-purple/15 text-nebula-purple">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 mb-1">收件人类型</p>
                    <p className="text-white/80">{selectedVersion.snapshot?.recipientType || 'future'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 mb-1">投递速度</p>
                    <p className="text-white/80">{selectedVersion.snapshot?.deliverySpeed || 'standard'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 mb-1">公开/匿名</p>
                    <p className="text-white/80">
                      {selectedVersion.snapshot?.isPublic ? '公开' : '私密'}
                      {selectedVersion.snapshot?.isAnonymous && ' · 匿名'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 mb-1">字数</p>
                    <p className="text-white/80">{selectedVersion.snapshot?.content?.length || 0} 字</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">选择左侧版本查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
