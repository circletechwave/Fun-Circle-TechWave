// PERMISSION_DENIED・API_ERRORは監査ログのアクション種別・フィルターUIには
// 存在するが、現時点でこれらを実際にINSERTするコードはどこにも存在しない
// （予約済みだが未使用のアクション種別）。将来実装する場合の想定発生箇所:
//   - PERMISSION_DENIED: RLSやAPI側の権限チェック（例: auditLogList.tsの
//     403 Forbidden、donations/lendingsのRLS拒否時）
//   - API_ERROR: バックエンド(donation-management-back)エンドポイントの
//     予期しない例外・500エラー発生時
export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'AUTH_ERROR'
  | 'PERMISSION_DENIED'
  | 'DONATION_CREATE'
  | 'DONATION_UPDATE'
  | 'DONATION_DELETE'
  | 'LENDING_CREATE'
  | 'LENDING_RETURN'
  | 'API_ERROR';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_path: string | null;
  request_method: string | null;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  page?: number;
  per_page?: number;
  action?: AuditAction;
  user_id?: string;
  table_name?: string;
  date_from?: string;
  date_to?: string;
  keyword?: string;
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  error?: string;
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN_SUCCESS: 'ログイン成功',
  LOGIN_FAILURE: 'ログイン失敗',
  LOGOUT: 'ログアウト',
  AUTH_ERROR: '認証エラー',
  PERMISSION_DENIED: '権限エラー',
  DONATION_CREATE: '寄贈物作成',
  DONATION_UPDATE: '寄贈物更新',
  DONATION_DELETE: '寄贈物削除',
  LENDING_CREATE: '貸出作成',
  LENDING_RETURN: '返却処理',
  API_ERROR: 'APIエラー',
};

export const ACTION_CATEGORIES: Record<AuditAction, 'security' | 'application'> = {
  LOGIN_SUCCESS: 'security',
  LOGIN_FAILURE: 'security',
  LOGOUT: 'security',
  AUTH_ERROR: 'security',
  PERMISSION_DENIED: 'security',
  DONATION_CREATE: 'application',
  DONATION_UPDATE: 'application',
  DONATION_DELETE: 'application',
  LENDING_CREATE: 'application',
  LENDING_RETURN: 'application',
  API_ERROR: 'application',
};
