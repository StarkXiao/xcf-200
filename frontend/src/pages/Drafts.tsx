import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Search, Trash2, Clock, Edit3, Send, Calendar, History,
  AlertTriangle, CheckCircle, ArrowRight, Sparkles, X, Plus,
  TrendingUp, SortAsc, SortDesc, Book, BarChart3
} from 'lucide-react';
import { draftsApi } from '@/api/drafts';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import DraftVersionHistory from '@/components/Drafts/DraftVersionHistory';
import type { Draft, DraftStats } from '@/types';
import { formatDate, cn } from '@/utils/helpers';

const recipientTypeLabels: Record<string, { icon: string; label: string; color: string }> = {
  future: { icon: '🔮', label: '未来的人', color: 'bg-aurora/15 text-aurora' },
  past: { icon: '🕰️', label: '过去的人', color: 'bg-nebula-purple/15 text-nebula-purple' },
  parallel: { icon: '🌌', label: '平行世界', color: 'bg-nebula-pink/15 text-nebula-pink' },
  unknown: { icon: '✨', label: '未知宇宙', color: 'bg-starlight/15 text-starlight' },
};

interface SubmitValidationModalProps {
  open: boolean;
  onClose: () => void;
  draft: Draft | null;
  onConfirmSubmit: () => void;
  validation: any;
  loading: boolean;
}

function SubmitValidationModal({ open, onClose, draft, onConfirmSubmit, validation, loading }: SubmitValidationModalProps) {
  if (!open || !draft) return null;

  const hasErrors = validation && !validation.valid;
  const hasWarnings = validation?.warnings?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            {hasErrors ? (
              <><AlertTriangle className="w-5 h-5 text-red-400" />发送校验失败</>
            ) : hasWarnings ? (
              <><AlertTriangle className="w-5 h-5 text-nebula-orange" />发送前提醒</>
            ) : (
              <><CheckCircle className="w-5 h-5 text-nebula-mint" />确认发送</>
            )}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="paper-card p-4 rounded-xl">
            <p className="text-xs text-cosmic-700/60 mb-1">信件标题</p>
            <p className="font-serif-sc text-lg font-semibold text-cosmic-900 truncate">
              {draft.title || '(无标题)'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-cosmic-300/40 text-cosmic-800">
                致{draft.recipient || '(收件人)'}
              </span>
              <span className="text-xs text-cosmic-700/60">
                {draft.wordCount || 0} 字
              </span>
            </div>
          </div>

          {validation?.scheduledCheck?.isPast && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  定时时间已过期，系统将使用立即发送模式。
                  {validation.scheduledCheck.suggestedDate && (
                    <>建议时间：{validation.scheduledCheck.suggestedDate} {validation.scheduledCheck.suggestedTime}</>
                  )}
                </span>
              </p>
            </div>
          )}

          {hasErrors && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                以下问题需要解决：
              </p>
              <div className="space-y-1.5">
                {Object.entries(validation.errors).map(([key, msg]) => (
                  <div key={key} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                    <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-red-300">{msg as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasWarnings && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-nebula-orange flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                温馨提示：
              </p>
              <div className="space-y-1.5">
                {validation.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-nebula-orange/8 border border-nebula-orange/20">
                    <AlertTriangle className="w-4 h-4 text-nebula-orange mt-0.5 shrink-0" />
                    <span className="text-sm text-nebula-orange/90">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasErrors && !hasWarnings && (
            <div className="p-4 rounded-xl bg-nebula-mint/10 border border-nebula-mint/30">
              <p className="text-sm text-nebula-mint flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>信件内容完整，可以立即发送。{draft.scheduledDelivery && draft.scheduledDate ? `将于 ${draft.scheduledDate} ${draft.scheduledTime} 定时送达。` : '将通过星尘航道立即送达。'}</span>
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">
            取消
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={hasErrors || loading}
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中...</>
            ) : (
              <><Send className="w-4 h-4" />{hasWarnings ? '仍然发送' : '确认发送'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Drafts() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<DraftStats | null>(null);
  const [loading, setLoadingLocal] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'updated' | 'created' | 'wordcount'>('updated');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingDraft, setSubmittingDraft] = useState<Draft | null>(null);
  const [submitValidation, setSubmitValidation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionDraftId, setVersionDraftId] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.id) fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, sortDesc, search]);

  const fetchAll = async () => {
    if (!user) return;
    await Promise.all([fetchDrafts(), fetchStats()]);
  };

  const fetchDrafts = async () => {
    if (!user) return;
    try {
      setLoadingLocal(true);
      const res = await draftsApi.getDrafts(user.id, {
        page,
        limit: 20,
        sort,
        search: search || undefined,
      });
      if (res.success) {
        let data = res.data || [];
        if (!sortDesc) data = [...data].reverse();
        setDrafts(data);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载草稿失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await draftsApi.getStats(user.id);
      if (res.success) setStats(res.data as DraftStats);
    } catch { /* ignore */ }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)));
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    if (!confirm(`确定要删除草稿《${title || '(无标题)'}》吗？此操作不可撤销。`)) return;
    try {
      setLoading(true);
      const res = await draftsApi.deleteDraft(id);
      if (res.success) {
        showToast({ type: 'success', message: '草稿已删除' });
        fetchAll();
      } else {
        showToast({ type: 'error', message: res.message || '删除失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个草稿吗？此操作不可撤销。`)) return;
    try {
      setLoading(true);
      const res = await draftsApi.batchDelete(Array.from(selectedIds));
      if (res.success) {
        showToast({ type: 'success', message: res.message || '批量删除成功' });
        setSelectedIds(new Set());
        setSelectMode(false);
        fetchAll();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = async (draft: Draft) => {
    setSubmittingDraft(draft);
    setSubmitValidation(null);
    setSubmitModalOpen(true);
    try {
      const res = await draftsApi.validateSubmit(draft.id);
      if (res.success) setSubmitValidation(res.data);
    } catch { /* ignore */ }
  };

  const handleSubmitConfirm = async () => {
    if (!submittingDraft || !user) return;
    try {
      setSubmitting(true);
      const res = await draftsApi.submitDraft(submittingDraft.id, {
        senderName: user.username,
      });
      if (res.success && res.data) {
        showToast({ type: 'success', message: res.message || '发送成功' });
        setSubmitModalOpen(false);
        setSubmittingDraft(null);
        setTimeout(() => {
          if (res.data?.letter?.id) navigate(`/letter/${res.data.letter.id}`);
        }, 600);
        fetchAll();
      } else {
        showToast({ type: 'error', message: res.message || '发送失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '发送失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = (d: Draft) =>
    d.recipient.trim() && d.title.trim() && d.content.trim().length >= 20 && (d.emotions?.length || 0) > 0;

  const statCards = [
    { label: '草稿总数', value: stats?.total || 0, icon: FileText, color: 'text-aurora', bg: 'bg-aurora/15' },
    { label: '自动保存', value: stats?.autoSaved || 0, icon: Clock, color: 'text-nebula-mint', bg: 'bg-nebula-mint/15' },
    { label: '带定时', value: stats?.scheduled || 0, icon: Calendar, color: 'text-nebula-purple', bg: 'bg-nebula-purple/15' },
    { label: '总字数', value: stats?.wordTotal || 0, icon: Book, color: 'text-starlight', bg: 'bg-starlight/15' },
  ];

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-nebula-mint animate-float" />
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            时光<span className="bg-gradient-to-r from-nebula-mint via-aurora to-starlight bg-clip-text text-transparent">草稿箱</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            未完成的信件会在此静静等待，每一次提笔都有星光守护
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in-up">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass-card p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/50">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="glass-card p-4 mb-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="搜索标题、内容或收件人..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <BarChart3 className="w-4 h-4 text-white/50" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-transparent text-sm text-white/70 focus:outline-none cursor-pointer"
                >
                  <option value="updated">更新时间</option>
                  <option value="created">创建时间</option>
                  <option value="wordcount">字数</option>
                </select>
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10"
                >
                  {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectMode ? (
                <>
                  <button onClick={toggleSelectAll} className="btn-secondary py-2 px-3.5 text-xs">
                    {selectedIds.size === drafts.length ? '取消全选' : '全选'} ({selectedIds.size})
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.size === 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />删除选中
                  </button>
                  <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="btn-secondary py-2 px-3.5 text-xs">
                    退出选择
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setSelectMode(true)} className="btn-secondary py-2 px-3.5 text-xs">
                    批量管理
                  </button>
                  <Link to="/write" className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />新建草稿
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center animate-fade-in">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg text-white/70 font-serif-sc mb-2">
              {search ? '没有找到匹配的草稿...' : '草稿箱还是空的...'}
            </p>
            <p className="text-sm text-white/50 mb-6">
              {search ? '换个关键词试试吧' : '写一封信，让你的思绪化作星尘'}
            </p>
            <Link to="/write" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />开始写信
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
            {drafts.map((draft, idx) => {
              const typeInfo = recipientTypeLabels[draft.recipientType] || recipientTypeLabels.future;
              const ready = canSubmit(draft);
              const selected = selectedIds.has(draft.id);

              return (
                <div
                  key={draft.id}
                  className={cn(
                    'glass-card p-5 rounded-2xl border transition-all relative group',
                    selected ? 'border-aurora/50 bg-aurora/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {selectMode && (
                    <button
                      onClick={() => toggleSelect(draft.id)}
                      className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-cosmic-950/80 backdrop-blur-sm border border-white/20 hover:bg-cosmic-900 transition-all"
                    >
                      {selected ? (
                        <CheckCircle className="w-4 h-4 text-aurora" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-white/40" />
                      )}
                    </button>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 mt-0.5', typeInfo.color)}>
                        <span>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </span>
                      {draft.scheduledDelivery && draft.scheduledDate && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-aurora/15 text-aurora flex items-center gap-1 shrink-0 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {draft.scheduledDate}
                        </span>
                      )}
                      {draft.autoSavedAt && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-nebula-mint/15 text-nebula-mint flex items-center gap-1 shrink-0 mt-0.5">
                          <TrendingUp className="w-3 h-3" />
                          自动保存
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setVersionDraftId(draft.id); setVersionHistoryOpen(true); }}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                        title="版本历史"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(draft.id, draft.title)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 cursor-pointer" onClick={() => navigate(`/write?draftId=${draft.id}`)}>
                    <h4 className="font-serif-sc text-lg font-semibold text-white truncate mb-1.5 group-hover:text-aurora transition-colors">
                      {draft.title || '(无标题草稿)'}
                    </h4>
                    <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                      {draft.content || '点击开始撰写这封信...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(draft.updatedAt)}
                      </span>
                      <span>致{draft.recipient || '(未填写)'}</span>
                      <span>{draft.wordCount || 0}字</span>
                      {(draft.emotions?.length || 0) > 0 && (
                        <span>{draft.emotions.length}标签</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/write?draftId=${draft.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />续写
                      </Link>
                      <button
                        onClick={() => openSubmitModal(draft)}
                        disabled={!ready}
                        className={cn(
                          'py-1.5 px-3 text-xs rounded-xl font-medium flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                          ready
                            ? 'bg-gradient-to-r from-cosmic-500 to-aurora text-white hover:shadow-glow'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        )}
                        title={ready ? '发送此草稿' : '请完善信件内容'}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {ready ? '发送' : <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />待完善</span>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
            >上一页</button>
            <span className="text-sm text-white/60 px-3">第 {page} / {totalPages} 页</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
            >下一页</button>
          </div>
        )}
      </div>

      <SubmitValidationModal
        open={submitModalOpen}
        onClose={() => { setSubmitModalOpen(false); setSubmittingDraft(null); }}
        draft={submittingDraft}
        onConfirmSubmit={handleSubmitConfirm}
        validation={submitValidation}
        loading={submitting}
      />

      <DraftVersionHistory
        draftId={versionDraftId}
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
      />
    </div>
  );
}
