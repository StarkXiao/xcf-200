import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Search, Sparkles, TrendingUp, Clock, Filter } from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import EmotionCloud from '@/components/Emotion/EmotionCloud';
import { lettersApi } from '@/api/letters';
import type { LetterListItem } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

type SortType = 'latest' | 'popular';

export default function Plaza() {
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [letters, setLetters] = useState<LetterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLetters = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await lettersApi.getLetters({
        page: currentPage,
        limit: 8,
        keyword: appliedKeyword || undefined,
        emotion: selectedEmotion || undefined,
        sort,
      });
      if (res.success) {
        setLetters(reset ? res.data : [...letters, ...res.data]);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        if (reset) setPage(1);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载信件失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKeyword, selectedEmotion, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(searchKeyword.trim());
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      setPage(page + 1);
      setTimeout(() => fetchLetters(false), 0);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchLetters(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="relative z-10">
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-starlight/10 border border-starlight/20 mb-6">
              <Sparkles className="w-4 h-4 text-starlight animate-pulse" />
              <span className="text-sm font-medium text-starlight/90">
                {total} 封穿越时空的信件正在星河中漂流
              </span>
            </div>

            <h1 className="font-serif-sc text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              在<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 星河邮局 </span>
              <br />
              寄出你的思念
            </h1>

            <p className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed">
              给未来的自己写一封信，向平行世界的 Ta 送去问候，
              <br className="hidden sm:block" />
              每一封信都会化作星星，在宇宙中闪耀。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/write' : '/login'}
                className="btn-primary flex items-center gap-2 text-base px-8 py-4 animate-pulse-glow"
              >
                <PenLine className="w-5 h-5" />
                写一封信
              </Link>
              <a
                href="#letters"
                className="btn-secondary flex items-center gap-2 text-base px-8 py-4"
              >
                <Sparkles className="w-5 h-5" />
                探索广场
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                情绪星河
              </h2>
              <span className="text-sm text-white/50 ml-2">点击标签筛选信件</span>
            </div>
            <EmotionCloud
              selected={selectedEmotion}
              onSelect={setSelectedEmotion}
              showAll
            />
          </div>
        </div>
      </section>

      <section id="letters" className="py-8 sm:py-10">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-starlight to-nebula-pink" />
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                信件广场
              </h2>
              {total > 0 && (
                <span className="text-sm text-white/50">共 {total} 封</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索信件..."
                    className="input-field pl-10 py-2.5 text-sm w-full"
                  />
                </div>
                <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">
                  搜索
                </button>
              </form>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSort('latest')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    sort === 'latest'
                      ? 'bg-aurora/20 text-aurora border border-aurora/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  最新
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    sort === 'popular'
                      ? 'bg-starlight/20 text-starlight border border-starlight/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  热门
                </button>
              </div>
            </div>
          </div>

          {(selectedEmotion || appliedKeyword) && (
            <div className="flex items-center gap-2 mb-6 animate-fade-in">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">筛选条件：</span>
              {selectedEmotion && (
                <span className="px-2.5 py-1 rounded-full bg-nebula-purple/20 text-nebula-purple/90 text-xs border border-nebula-purple/30">
                  🏷️ {selectedEmotion}
                </span>
              )}
              {appliedKeyword && (
                <span className="px-2.5 py-1 rounded-full bg-aurora/20 text-aurora/90 text-xs border border-aurora/30">
                  🔍 "{appliedKeyword}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedEmotion(null);
                  setSearchKeyword('');
                  setAppliedKeyword('');
                }}
                className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 ml-2"
              >
                清除筛选
              </button>
            </div>
          )}

          {loading && letters.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 sm:h-80 rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌠</div>
              <p className="text-lg text-white/70 font-serif-sc mb-2">
                这片星域暂时没有信件...
              </p>
              <p className="text-sm text-white/50 mb-6">
                不如成为第一位寄出信件的人吧！
              </p>
              <Link
                to={isAuthenticated ? '/write' : '/login'}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                写第一封信
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {letters.map((letter, index) => (
                  <LetterCard key={letter.id} letter={letter} index={index} />
                ))}
              </div>

              {page < totalPages && (
                <div className="text-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn-secondary px-8 py-3.5"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        加载中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        探索更多信件
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
