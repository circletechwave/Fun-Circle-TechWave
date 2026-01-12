import { QueryClient } from '@tanstack/react-query';

/**
 * React Queryのクライアント設定
 *
 * データフェッチングのキャッシュ管理、リトライ、リフェッチの設定を行います。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分 - データが古いと判断されるまでの時間
      gcTime: 10 * 60 * 1000, // 10分 - ガベージコレクションまでの時間
      retry: 1, // 失敗時のリトライ回数
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動リフェッチを無効化
    },
    mutations: {
      retry: 0, // ミューテーション失敗時はリトライしない
    },
  },
});
