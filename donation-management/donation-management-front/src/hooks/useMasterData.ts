import { useQuery } from '@tanstack/react-query';
import { donationApi } from '../services/donationApi';

/**
 * カテゴリ一覧を取得するカスタムフック
 *
 * マスターデータであるカテゴリ情報をReact Queryでキャッシュ管理します。
 * カテゴリは頻繁に変更されないため、staleTimeを30分に設定しています。
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await donationApi.getCategories();
      if (!result.success) {
        throw new Error(result.error || 'カテゴリの取得に失敗しました');
      }
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30分
  });
};

/**
 * 保管場所一覧を取得するカスタムフック
 *
 * マスターデータである保管場所情報をReact Queryでキャッシュ管理します。
 * 保管場所は頻繁に変更されないため、staleTimeを30分に設定しています。
 */
export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const result = await donationApi.getLocations();
      if (!result.success) {
        throw new Error(result.error || '保管場所の取得に失敗しました');
      }
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30分
  });
};

/**
 * タグ一覧を取得するカスタムフック
 *
 * マスターデータであるタグ情報をReact Queryでキャッシュ管理します。
 * タグは頻繁に変更されないため、staleTimeを30分に設定しています。
 */
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const result = await donationApi.getTags();
      if (!result.success) {
        throw new Error(result.error || 'タグの取得に失敗しました');
      }
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30分
  });
};
