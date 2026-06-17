import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  Link as LinkIcon,
  UserX,
  User,
  Palette,
  Sparkles,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  Mail,
} from 'lucide-react';
import { sharesApi } from '@/api/shares';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { SharePosterData, PosterEmotionStyle } from '@/types';
import { formatDate, truncateText } from '@/utils/helpers';

interface SharePosterModalProps {
  open: boolean;
  onClose: () => void;
  data: SharePosterData;
}

interface EmotionStyleConfig {
  name: string;
  label: string;
  icon: string;
  bgGradient: [string, string, string];
  textColor: string;
  accentColor: string;
  cardBg: string;
  borderColor: string;
}

const EMOTION_STYLES: Record<PosterEmotionStyle, EmotionStyleConfig> = {
  warm: {
    name: 'warm',
    label: '温暖',
    icon: '☀️',
    bgGradient: ['#FF9A8B', '#FF6A88', '#FF99AC'],
    textColor: '#4A2040',
    accentColor: '#E74C3C',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 154, 139, 0.4)',
  },
  healing: {
    name: 'healing',
    label: '治愈',
    icon: '🌿',
    bgGradient: ['#A8E6CF', '#88D8B0', '#56AB91'],
    textColor: '#1A3C2E',
    accentColor: '#2ECC71',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(168, 230, 207, 0.4)',
  },
  hope: {
    name: 'hope',
    label: '希望',
    icon: '✨',
    bgGradient: ['#F1C40F', '#F39C12', '#E67E22'],
    textColor: '#4A3200',
    accentColor: '#F39C12',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(241, 196, 15, 0.4)',
  },
  miss: {
    name: 'miss',
    label: '思念',
    icon: '💭',
    bgGradient: ['#9B59B6', '#8E44AD', '#6C3483'],
    textColor: '#F5EEF8',
    accentColor: '#D7BDE2',
    cardBg: 'rgba(50, 30, 70, 0.85)',
    borderColor: 'rgba(155, 89, 182, 0.4)',
  },
  mystery: {
    name: 'mystery',
    label: '神秘',
    icon: '🌌',
    bgGradient: ['#5E35B1', '#4527A0', '#311B92'],
    textColor: '#EDE7F6',
    accentColor: '#B39DDB',
    cardBg: 'rgba(30, 20, 60, 0.85)',
    borderColor: 'rgba(94, 53, 177, 0.4)',
  },
  happiness: {
    name: 'happiness',
    label: '幸福',
    icon: '🎀',
    bgGradient: ['#F06292', '#EC407A', '#D81B60'],
    textColor: '#4A1030',
    accentColor: '#EC407A',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(240, 98, 146, 0.4)',
  },
  courage: {
    name: 'courage',
    label: '勇气',
    icon: '🔥',
    bgGradient: ['#E74C3C', '#C0392B', '#922B21'],
    textColor: '#FDEDEC',
    accentColor: '#F5B7B1',
    cardBg: 'rgba(60, 20, 20, 0.85)',
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  auto: {
    name: 'auto',
    label: '自动',
    icon: '🎨',
    bgGradient: ['#7C3AED', '#06B6D4', '#F59E0B'],
    textColor: '#FFFFFF',
    accentColor: '#A78BFA',
    cardBg: 'rgba(30, 20, 50, 0.85)',
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
};

const EMOTION_TO_STYLE: Record<string, PosterEmotionStyle> = {
  温暖: 'warm',
  治愈: 'healing',
  希望: 'hope',
  思念: 'miss',
  神秘: 'mystery',
  幸福: 'happiness',
  勇气: 'courage',
  爱情: 'happiness',
  遗憾: 'miss',
  亲情: 'warm',
  好奇: 'mystery',
  孤独: 'miss',
  怀念: 'miss',
  梦想: 'hope',
  告别: 'courage',
};

const SHARE_CHANNELS = [
  { key: 'clipboard', label: '复制链接', icon: LinkIcon },
  { key: 'download', label: '下载海报', icon: Download },
];

function detectEmotionStyle(emotions?: string[]): PosterEmotionStyle {
  if (!emotions || emotions.length === 0) return 'auto';
  for (const emotion of emotions) {
    if (EMOTION_TO_STYLE[emotion]) {
      return EMOTION_TO_STYLE[emotion];
    }
  }
  return 'auto';
}

export default function SharePosterModal({ open, onClose, data }: SharePosterModalProps) {
  const { user } = useAuthStore();
  const { showToast, setLoading } = useUIStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [emotionStyle, setEmotionStyle] = useState<PosterEmotionStyle>('auto');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const effectiveStyle =
    emotionStyle === 'auto' ? detectEmotionStyle(data.emotions) : emotionStyle;
  const styleConfig = EMOTION_STYLES[effectiveStyle];

  const wrapText = useCallback(
    (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      const lines: string[] = [];
      let currentLine = '';
      const chars = text.split('');
      for (const char of chars) {
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    },
    []
  );

  const drawPoster = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    const W = 750;
    const H = 1200;
    canvas.width = W;
    canvas.height = H;

    const cfg = styleConfig;

    try {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, cfg.bgGradient[0]);
      gradient.addColorStop(0.5, cfg.bgGradient[1]);
      gradient.addColorStop(1, cfg.bgGradient[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.random() * 2.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.restore();

      const cardX = 50;
      const cardY = 50;
      const cardW = W - 100;
      const cardH = H - 200;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      const r = 28;
      ctx.moveTo(cardX + r, cardY);
      ctx.lineTo(cardX + cardW - r, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
      ctx.lineTo(cardX + cardW, cardY + cardH - r);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
      ctx.lineTo(cardX + r, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
      ctx.lineTo(cardX, cardY + r);
      ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
      ctx.closePath();
      ctx.fillStyle = cfg.cardBg;
      ctx.fill();
      ctx.restore();

      let curY = cardY + 50;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = cfg.accentColor;
      ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
      const badgeText = data.targetType === 'letter' ? '✦ 星邮局 · 信件分享 ✦' : '✦ 星邮局 · 星阁名片 ✦';
      ctx.fillText(badgeText, W / 2, curY);
      curY += 30;

      ctx.fillStyle = cfg.textColor;
      ctx.globalAlpha = 0.5;
      ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(cfg.icon + '  ' + cfg.label + '主题海报', W / 2, curY);
      ctx.globalAlpha = 1;
      curY += 50;
      ctx.restore();

      if (data.targetType === 'letter') {
        ctx.save();
        ctx.textAlign = 'left';
        const contentX = cardX + 50;
        const contentW = cardW - 100;

        if (data.title) {
          ctx.fillStyle = cfg.textColor;
          ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", serif';
          const titleLines = wrapText(ctx, data.title, contentW);
          for (const line of titleLines.slice(0, 2)) {
            ctx.fillText(line, contentX, curY);
            curY += 44;
          }
          curY += 10;
        }

        if (data.emotions && data.emotions.length > 0) {
          ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
          const emotionStr = data.emotions.slice(0, 4).join('  ·  ');
          ctx.fillStyle = cfg.accentColor;
          ctx.fillText('「 ' + emotionStr + ' 」', contentX, curY);
          curY += 30;
        }

        curY += 20;
        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(contentX, curY);
        ctx.lineTo(contentX + contentW, curY);
        ctx.stroke();
        ctx.setLineDash([]);
        curY += 30;

        if (data.content) {
          ctx.fillStyle = cfg.textColor;
          ctx.globalAlpha = 0.85;
          ctx.font = '20px/36px "PingFang SC", "Microsoft YaHei", serif';
          const displayContent = truncateText(data.content, 300);
          const contentLines = wrapText(ctx, displayContent, contentW);
          for (const line of contentLines.slice(0, 10)) {
            ctx.fillText(line, contentX, curY);
            curY += 36;
          }
          if (data.content.length > 300) {
            ctx.fillStyle = cfg.accentColor;
            ctx.font = 'italic 16px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillText('……（完整内容请前往星邮局阅读）', contentX, curY);
            curY += 30;
          }
          ctx.globalAlpha = 1;
        }

        curY = Math.min(curY + 20, cardY + cardH - 260);

        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(contentX, curY);
        ctx.lineTo(contentX + contentW, curY);
        ctx.stroke();
        curY += 30;

        ctx.fillStyle = cfg.textColor;
        ctx.globalAlpha = 0.7;
        ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
        const recipientText = data.recipient
          ? `致 ${data.recipient}`
          : '致 平行世界的你';
        ctx.textAlign = 'right';
        ctx.fillText(recipientText, contentX + contentW, curY);
        curY += 30;

        ctx.textAlign = 'left';
        const senderDisplay = isAnonymous ? '匿名星人' : data.senderName || '匿名星人';
        ctx.fillStyle = cfg.textColor;
        ctx.fillText('—— ' + senderDisplay, contentX, curY);
        if (data.createdAt) {
          ctx.textAlign = 'right';
          ctx.globalAlpha = 0.5;
          ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(formatDate(data.createdAt), contentX + contentW, curY);
        }
        ctx.globalAlpha = 1;
        curY += 40;

        const stats = [
          { icon: Heart, value: data.likes || 0, label: '颗星星' },
          { icon: MessageCircle, value: data.repliesCount || 0, label: '封回信' },
          { icon: Eye, value: data.views || 0, label: '次浏览' },
        ];

        const statWidth = contentW / stats.length;
        stats.forEach((stat, idx) => {
          const sx = contentX + statWidth * idx + statWidth / 2;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = cfg.accentColor;
          ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(String(stat.value), sx, curY);
          curY += 26;
          ctx.fillStyle = cfg.textColor;
          ctx.globalAlpha = 0.6;
          ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(stat.label, sx, curY);
          ctx.restore();
        });

        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = 'center';
        const centerX = W / 2;

        const avatarY = curY + 20;
        const avatarSize = 140;

        ctx.beginPath();
        ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
        const avatarGradient = ctx.createLinearGradient(centerX, avatarY, centerX, avatarY + avatarSize);
        avatarGradient.addColorStop(0, cfg.bgGradient[0]);
        avatarGradient.addColorStop(1, cfg.bgGradient[2]);
        ctx.strokeStyle = avatarGradient;
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = cfg.cardBg === 'rgba(255, 255, 255, 0.92)' ? '#F8F9FA' : '#1a1030';
        ctx.fill();
        ctx.clip();

        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const avatarDisplay = isAnonymous ? '✨' : data.senderAvatar || '⭐';
        ctx.fillText(avatarDisplay, centerX, avatarY + avatarSize / 2 + 4);
        ctx.restore();

        curY = avatarY + avatarSize + 40;

        ctx.save();
        ctx.textAlign = 'center';
        const nameDisplay = isAnonymous ? '匿名星人' : data.senderName || '星邮局用户';
        ctx.fillStyle = cfg.textColor;
        ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(nameDisplay, centerX, curY);
        curY += 30;

        if (data.userStats?.joinDate) {
          ctx.globalAlpha = 0.5;
          ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText('✦ 加入于 ' + formatDate(data.userStats.joinDate) + ' ✦', centerX, curY);
          ctx.globalAlpha = 1;
          curY += 50;
        } else {
          curY += 40;
        }

        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(cardX + 50, curY);
        ctx.lineTo(cardX + cardW - 50, curY);
        ctx.stroke();
        ctx.setLineDash([]);
        curY += 40;

        const profileStats = [
          { icon: Mail, value: data.userStats?.totalLetters || 0, label: '寄出信件' },
          { icon: Heart, value: data.userStats?.totalLikes || 0, label: '收到星星' },
          { icon: MessageCircle, value: data.userStats?.totalReplies || 0, label: '收到回信' },
          { icon: Bookmark, value: data.userStats?.totalFavorites || 0, label: '收藏信件' },
        ];

        const pStatW = (cardW - 140) / profileStats.length;
        profileStats.forEach((stat, idx) => {
          const psx = cardX + 70 + pStatW * idx + pStatW / 2;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = cfg.accentColor;
          ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(String(stat.value), psx, curY);
          curY += 28;
          ctx.fillStyle = cfg.textColor;
          ctx.globalAlpha = 0.6;
          ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.fillText(stat.label, psx, curY);
          ctx.restore();
        });
        curY -= 28;

        curY += 60;
        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 50, curY);
        ctx.lineTo(cardX + cardW - 50, curY);
        ctx.stroke();
        curY += 30;

        if (data.letterCount && data.letterCount > 0) {
          ctx.fillStyle = cfg.textColor;
          ctx.globalAlpha = 0.85;
          ctx.font = '17px "PingFang SC", "Microsoft YaHei", serif';
          const inviteText = `TA 在星邮局写下了 ${data.letterCount} 封信件`;
          ctx.fillText(inviteText, centerX, curY);
          curY += 28;
          ctx.fillText('每一封都是穿越时空的心意', centerX, curY);
        } else {
          ctx.fillStyle = cfg.textColor;
          ctx.globalAlpha = 0.85;
          ctx.font = '17px "PingFang SC", "Microsoft YaHei", serif';
          ctx.fillText('在星邮局，每封信都有归处', centerX, curY);
          curY += 28;
          ctx.fillText('快来和TA一起开启时空信件之旅吧', centerX, curY);
        }
        ctx.globalAlpha = 1;

        ctx.restore();
      }

      const footerY = H - 100;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.95;
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('✧ 星 邮 局 ✧', W / 2, footerY);
      curY = footerY + 30;

      ctx.globalAlpha = 0.75;
      ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('穿越时空的信件 · 遇见平行世界的温暖', W / 2, curY);
      curY += 24;

      ctx.globalAlpha = 0.55;
      ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(
        '扫码或搜索「星邮局」App 查看完整内容',
        W / 2,
        curY
      );
      ctx.restore();
    } finally {
      setIsGenerating(false);
    }
  }, [data, isAnonymous, styleConfig, wrapText]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => drawPoster(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, drawPoster]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setLoading(true);
      if (user) {
        await sharesApi.createShare({
          targetType: data.targetType,
          targetId: data.targetId,
          shareChannel: 'download',
          emotionStyle: effectiveStyle,
          isAnonymous,
          userId: user.id,
        });
      }

      const link = document.createElement('a');
      link.download = `星邮局-${data.targetType === 'letter' ? '信件海报' : '星阁名片'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast({ type: 'success', message: '海报已保存 ✨' });
      onClose();
    } catch (err) {
      showToast({ type: 'error', message: '保存海报失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setLoading(true);
      const res = user
        ? await sharesApi.createShare({
            targetType: data.targetType,
            targetId: data.targetId,
            shareChannel: 'clipboard',
            emotionStyle: effectiveStyle,
            isAnonymous,
            userId: user.id,
          })
        : null;

      let shareUrl = window.location.href;
      if (res?.data?.shareUrl) {
        shareUrl = res.data.shareUrl;
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast({ type: 'success', message: '链接已复制到剪贴板 ✨' });
      onClose();
    } catch (err) {
      showToast({ type: 'error', message: '复制链接失败' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-serif-sc text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-starlight" />
              {data.targetType === 'letter' ? '生成信件海报' : '生成星阁名片'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 260px)' }}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <Palette className="w-4 h-4 text-nebula-purple" />
                <span className="text-sm text-white/70">主题风格</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EMOTION_STYLES) as PosterEmotionStyle[]).map((style) => {
                  const sc = EMOTION_STYLES[style];
                  const isActive = emotionStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => setEmotionStyle(style)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'shadow-lg scale-105'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(135deg, ${sc.bgGradient[0]}, ${sc.bgGradient[2]})`,
                              color:
                                sc.name === 'miss' || sc.name === 'mystery' || sc.name === 'courage' || sc.name === 'auto'
                                  ? '#fff'
                                  : sc.textColor,
                              border: 'none',
                            }
                          : undefined
                      }
                    >
                      <span>{sc.icon}</span>
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer border ${
                  isAnonymous
                    ? 'bg-nebula-purple/20 border-nebula-purple/40 text-nebula-purple'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                {isAnonymous ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isAnonymous ? '匿名模式' : '显示身份'}
                </span>
              </div>
              <p className="text-xs text-white/40 flex-1">
                {isAnonymous
                  ? '海报中会隐藏发送者信息，保护隐私'
                  : '海报中将显示你的昵称和头像'}
              </p>
            </div>

            <div className="flex justify-center py-4">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ width: '320px' }}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block"
                  style={{ aspectRatio: '750 / 1200' }}
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                选择分享方式
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SHARE_CHANNELS.map((channel) => {
                  const ChannelIcon = channel.icon;
                  const isSelected = selectedChannel === channel.key;
                  return (
                    <button
                      key={channel.key}
                      onClick={() => setSelectedChannel(channel.key)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-aurora/20 border-aurora/40 ring-2 ring-aurora/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <ChannelIcon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-aurora' : 'text-white/70'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? 'text-aurora' : 'text-white/80'
                        }`}
                      >
                        {channel.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-5 py-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selectedChannel === 'download') {
                  handleDownload();
                } else {
                  handleCopyLink();
                }
              }}
              disabled={!selectedChannel || isGenerating}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {selectedChannel === 'download' ? '下载海报' : selectedChannel === 'clipboard' ? '复制链接' : '确认分享'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
