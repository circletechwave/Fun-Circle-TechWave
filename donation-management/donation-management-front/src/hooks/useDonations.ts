import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Donation, SearchFilters } from '../types/donation';
import { donationApi } from '../services/donationApi';

/**
 * 寄贈物一覧を取得するカスタムフック
 *
 * @param filters - 検索フィルター条件
 * @returns 寄贈物一覧とページネーション情報
 */
export const useDonations = (filters: Partial<SearchFilters>) => {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: async () => {
      const result = await donationApi.searchDonations(filters);
      if (!result.success) {
        throw new Error(result.error || '寄贈物の取得に失敗しました');
      }
      return result;
    },
  });
};

/**
 * 寄贈物詳細を取得するカスタムフック
 *
 * @param id - 寄贈物ID
 * @returns 寄贈物詳細情報
 */
export const useDonation = (id: string) => {
  return useQuery({
    queryKey: ['donation', id],
    queryFn: async () => {
      const result = await donationApi.getDonation(id);
      if (!result.success) {
        throw new Error(result.error || '寄贈物詳細の取得に失敗しました');
      }
      return result;
    },
    enabled: !!id, // IDが存在する場合のみクエリを実行
  });
};

/**
 * 寄贈物を新規登録するカスタムフック
 *
 * @returns ミューテーション関数とステータス
 */
export const useCreateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Donation>) => {
      const result = await donationApi.createDonation(data);
      if (!result.success) {
        throw new Error(result.error || '登録に失敗しました');
      }
      return result;
    },
    onSuccess: () => {
      // 寄贈物一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
  });
};

/**
 * 寄贈物を更新するカスタムフック
 *
 * @returns ミューテーション関数とステータス
 */
export const useUpdateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Donation> }) => {
      const result = await donationApi.updateDonation(id, data);
      if (!result.success) {
        throw new Error(result.error || '更新に失敗しました');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // 寄贈物一覧と詳細のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donation', variables.id] });
    },
  });
};

/**
 * 寄贈物を削除するカスタムフック
 *
 * @returns ミューテーション関数とステータス
 */
export const useDeleteDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await donationApi.deleteDonation(id);
      if (!result.success) {
        throw new Error(result.error || '削除に失敗しました');
      }
      return result;
    },
    onSuccess: () => {
      // 寄贈物一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
  });
};
