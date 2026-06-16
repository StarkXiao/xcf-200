import { useState } from 'react';
import { History, Clock, RotateCcw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatFullDate } from '@/utils/helpers';
import type { LetterVersion } from '@/types';

interface VersionHistoryProps {
  versions: LetterVersion[];
  currentVersion?: number;
  onRestore?: (versionId: string) => void;
  onView?: (version: LetterVersion) => void;
  className?: string;
}

export default function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onView,
  className,
}: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  if (versions.length === 0) {
    return (
      <div className={cn('glass-card p-8 text-center', className)}>
        <div className="text-4xl mb-4">📜</div>
        <p className="text-white/60">暂无历史版本</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {versions.map((version, index) => {
        const isExpanded = expandedVersion === version.id;
        const isCurrent = currentVersion && version.version === currentVersion;

        return (
          <div
            key={version.id}
            className={cn(
              'rounded-xl border transition-all duration-300 overflow-hidden',
              isCurrent
                ? 'border-aurora/40 bg-aurora/5'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            )}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleExpand(version.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                      isCurrent
                        ? 'bg-aurora/20 text-aurora'
                        : 'bg-white/10 text-white/70'
                    )}
                  >
                    v{version.version}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white truncate">
                        {version.title}
                      </h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-aurora/20 text-aurora">
                          当前版本
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      <span>{formatFullDate(version.createdAt)}</span>
                      {version.versionNote && (
                        <>
                          <span>·</span>
                          <span className="truncate">{version.versionNote}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(version);
                      }}
                      className="p-2 rounded-lg text-white/50 hover:text-aurora hover:bg-aurora/10 transition-all"
                      title="查看版本"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {onRestore && !isCurrent && version.version !== 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(version.id);
                      }}
                      className="p-2 rounded-lg text-white/50 hover:text-starlight hover:bg-starlight/10 transition-all"
                      title="恢复此版本"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-white/10">
                <div className="pt-4 space-y-3">
                  <div>
                    <div className="text-xs text-white/50 mb-1">收件人</div>
                    <div className="text-sm text-white/80">{version.recipient}</div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50 mb-1">情绪标签</div>
                    <div className="flex flex-wrap gap-1">
                      {version.emotions.map((emo) => (
                        <span
                          key={emo}
                          className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70"
                        >
                          {emo}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50 mb-1">内容预览</div>
                    <div className="p-3 rounded-lg bg-white/5 text-sm text-white/70 whitespace-pre-line line-clamp-4 font-serif-sc">
                      {version.content}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
