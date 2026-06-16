import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Heart, Eye, Calendar, Share2, User,
  AlertCircle, Home
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { activitiesApi } from '@/api/activities';
import type { Work, Activity } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';

export default function WorkDetail() {
  const { activityId, workId } = useParams<{ activityId: string; workId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [work, setWork] = useState<Work | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [likeStatus, setLikeStatus] = useState({ liked: false, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  const fetchData = async () => {
    if (!activityId || !workId) return;
    setLoading(true);
    try {
      const [workRes, activityRes, likeRes] = await Promise.all([
        activitiesApi.getWork(activityId, workId),
        activitiesApi.getActivity(activityId),
        activitiesApi.getLikeStatus(activityId, workId, user?.id)
      ]);

      setWork(workRes.data.data);
      setActivity(activityRes.data.data);
      setLikeStatus(likeRes.data.data);
    } catch (error: any) {
      console.error('Failed to fetch work:', error);
      if (error.response?.status === 403) {
        showToast({ type: 'error', message: '作品暂未公开' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activityId, workId, user?.id]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!activityId || !workId) return;

    setLiking(true);
    try {
      if (likeStatus.liked) {
        await activitiesApi.unlikeWork(activityId, workId, user.id);
        setLikeStatus(prev => ({ ...prev, liked: false, likes: prev.likes - 1 }));
        showToast({ type: 'info', message: '已取消点赞' });
      } else {
        await activitiesApi.likeWork(activityId, workId, user.id);
        setLikeStatus(prev => ({ ...prev, liked: true, likes: prev.likes + 1 }));
        showToast({ type: 'success', message: '已送上一颗小星星 ✨' });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.response?.data?.message || '操作失败'
      });
    } finally {
      setLiking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: work?.title,
        text: work?.content.substring(0, 100),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({ type: 'success', message: '链接已复制到剪贴板' });
    }
  };

  if (loading && !work) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-aurora/30 border-t-aurora rounded-full" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-4">作品不存在或暂未公开</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/activities/${activityId}`)}
              className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              返回活动
            </button>
            <Link
              to="/activities"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-cosmic-500 to-aurora text-white hover:shadow-glow transition-all"
            >
              <Home className="w-4 h-4 inline mr-2" />
              活动广场
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <button
          onClick={() => navigate(`/activities/${activityId}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回活动
        </button>

        {activity && (
          <Link
            to={`/activities/${activityId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all mb-6"
          >
            <span className="text-xl">{activity.coverImage}</span>
            <span className="text-sm">{activity.title}</span>
          </Link>
        )}

        <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="mb-8">
              {work.rank && (
                <div className="flex items-center gap-2 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    work.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    work.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    work.rank === 3 ? 'bg-amber-600/20 text-amber-500' :
                    'bg-white/5 text-white/60'
                  }`}>
                    {work.rank === 1 ? '🏆 第一名' :
                     work.rank === 2 ? '🥈 第二名' :
                     work.rank === 3 ? '🥉 第三名' :
                     `第 ${work.rank} 名`}
                  </div>
                </div>
              )}

              <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                {work.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{work.userAvatar}</span>
                  <span className="text-white/80">
                    {work.username}
                    {work.isAnonymous && <span className="text-white/40 ml-1">（匿名）</span>}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(work.publishedAt || work.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {work.views} 阅读
                </span>
              </div>
            </header>

            <div className="prose prose-invert max-w-none mb-8">
              {work.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="text-white/80 leading-loose mb-4 font-serif-sc text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {work.emotions.map((emotion, idx) => (
                <EmotionTag key={idx} name={emotion} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    likeStatus.liked
                      ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likeStatus.liked ? 'fill-current' : ''}`} />
                  <span>{likeStatus.liked}</span>
                  <span className="text-sm">({likeStatus.likes})</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">分享</span>
                </button>
              </div>

              <div className="text-sm text-white/40">
                {work.wordCount} 字
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            to={`/activities/${activityId}/works`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <Eye className="w-5 h-5" />
            查看更多作品
          </Link>
        </div>
      </div>
    </div>
  );
}
