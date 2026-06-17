import { useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { sharesApi } from '@/api/shares';
import useAuthStore from '@/store/useAuthStore';

export function useShare(targetType: 'letter' | 'profile', targetId: string | undefined) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const shareId = searchParams.get('share');

  const recordShareView = useCallback(async () => {
    if (!shareId || !targetId) return;

    try {
      const shareUrl = window.location.href;
      await sharesApi.recordShareView({
        targetType,
        targetId,
        shareId,
        shareUrl,
        viewerId: user?.id,
      });
    } catch (err) {
      console.warn('Failed to record share view:', err);
    }
  }, [shareId, targetType, targetId, user?.id]);

  useEffect(() => {
    if (shareId && targetId) {
      const hasRecorded = sessionStorage.getItem(
        `share_view_${shareId}_${targetId}`
      );
      if (!hasRecorded) {
        recordShareView();
        sessionStorage.setItem(`share_view_${shareId}_${targetId}`, 'true');
      }
    }
  }, [shareId, targetId, recordShareView]);

  return {
    shareId,
    isFromShare: !!shareId,
  };
}

export function useShareTracking() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const pendingShareView = useCallback(
    async (targetType: 'letter' | 'profile', targetId: string) => {
      const shareId = searchParams.get('share');
      if (!shareId) return;

      const storageKey = `share_view_${shareId}_${targetId}`;
      const hasRecorded = sessionStorage.getItem(storageKey);
      if (hasRecorded) return;

      try {
        const shareUrl = window.location.href;
        await sharesApi.recordShareView({
          targetType,
          targetId,
          shareId,
          shareUrl,
          viewerId: user?.id,
        });
        sessionStorage.setItem(storageKey, 'true');
      } catch (err) {
        console.warn('Failed to record share view:', err);
      }
    },
    [searchParams, user?.id]
  );

  return {
    pendingShareView,
    shareId: searchParams.get('share'),
  };
}
