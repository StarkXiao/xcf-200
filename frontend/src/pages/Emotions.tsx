import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { emotionsApi } from '@/api/emotions';
import { lettersApi } from '@/api/letters';
import useUIStore from '@/store/useUIStore';
import type { Emotion, LetterListItem } from '@/types';

type ViewMode = 'all' | 'detail';

export default function EmotionsPage() {
  const { name } = useParams<{ name?: string }>();
  const { showToast } = useUIStore();

  const viewMode: ViewMode = name ? 'detail' : 'all';
  const decodedName = name ? decodeURIComponent(name) : '';

  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [letters, setLetters] = useState<LetterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllEmotions();
    } else {
      fetchEmotionLetters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const fetchAllEmotions = async () => {
    try {
      setLoading(true);
      const res = await emotionsApi.getAll();
      if (res.success) {
        setEmotions(res.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载情绪标签失败' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmotionLetters = async () => {
    try {
      setLoading(true);
      const res = await lettersApi.getLetters({
        emotion: decodedName,
        limit: 20,
      });
      if (res.success) {
        setLetters(res.data);
        setTotal(res.total);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载信件失败' });
    } finally {
      setLoading(false);
    }
  };

  const currentEmotion = emotions.find((e) => e.name === decodedName);

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        {viewMode === 'all' ? (
          <>
            <div className="text-center mb-10 sm:mb-14 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-7 h-7 text-starlight animate-float" />
              </div>
              <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-nebula-purple via-aurora to-nebula-pink bg-clip-text text-transparent">
                  情绪星河
                </span>
              </h1>
              <p className="text-white/60 max-w-xl mx-auto text-base sm:text-lg">
                每一种情绪都是一颗独特的星星，点击进入，找到与你共鸣的那些信
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 sm:h-36 rounded-2xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 animate-stagger">
                {emotions.map((emo, index) => (
                  <Link
                    key={emo.id}
                    to={`/emotions/${encodeURIComponent(emo.name)}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className="group relative h-32 sm:h-36 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${emo.color}25 0%, ${emo.color}10 100%)`,
                        border: `1px solid ${emo.color}35`,
                      }}
                    >
                      <div
                        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl"
                        style={{ backgroundColor: emo.color }}
                      />

                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <div className="text-3xl sm:text-4xl mb-2 transform group-hover:scale-110 transition-transform">
                            {emo.icon}
                          </div>
                          <h3 className="font-serif-sc text-lg sm:text-xl font-semibold text-white mb-1">
                            {emo.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: `${emo.color}25`,
                              color: emo.color,
                            }}
                          >
                            {emo.count} 封信件
                          </span>
                          <span className="text-white/40 group-hover:text-white/70 transition-colors text-sm">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Link
              to="/emotions"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
              <span>返回情绪星河</span>
            </Link>

            <div
              className="relative glass-card p-6 sm:p-10 mb-10 overflow-hidden animate-scale-in"
              style={{
                border: currentEmotion
                  ? `1px solid ${currentEmotion.color}35`
                  : undefined,
              }}
            >
              {currentEmotion && (
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30"
                  style={{ backgroundColor: currentEmotion.color }}
                />
              )}
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: currentEmotion
                      ? `linear-gradient(135deg, ${currentEmotion.color}40 0%, ${currentEmotion.color}15 100%)`
                      : undefined,
                    border: currentEmotion
                      ? `1px solid ${currentEmotion.color}50`
                      : undefined,
                  }}
                >
                  <span className="text-5xl sm:text-6xl">
                    {currentEmotion?.icon || '✨'}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h1 className="font-serif-sc text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                      {decodedName}
                    </h1>
                    {currentEmotion && (
                      <EmotionTag
                        name={decodedName}
                        color={currentEmotion.color}
                        count={total}
                        showCount
                      />
                    )}
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    这里收集了所有与「{decodedName}」有关的信件，
                    {total > 0
                      ? `共 ${total} 颗星星在这片星域中闪烁。`
                      : '暂时还没有信件，要不要成为第一个？'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-starlight" />
                相关信件
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-80 rounded-2xl bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : letters.length === 0 ? (
                <div className="text-center py-20 glass-card">
                  <div className="text-6xl mb-4">🌌</div>
                  <p className="text-lg text-white/70 font-serif-sc mb-2">
                    这片星域还没有「{decodedName}」的信件...
                  </p>
                  <p className="text-sm text-white/50 mb-6">
                    让你的信成为这里的第一颗星星吧！
                  </p>
                  <Link to="/write" className="btn-primary inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    写一封信
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {letters.map((letter, index) => (
                    <LetterCard key={letter.id} letter={letter} index={index} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
