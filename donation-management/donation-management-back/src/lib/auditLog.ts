import type { Context } from "hono";
import { createSupabaseClient } from "./supabase";
import type { Env } from "../types";

/**
 * 監査ログのアクション種別
 */
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "AUTH_ERROR"
  | "PERMISSION_DENIED"
  | "DONATION_CREATE"
  | "DONATION_UPDATE"
  | "DONATION_DELETE"
  | "LENDING_CREATE"
  | "LENDING_RETURN"
  | "API_ERROR";

/**
 * 監査ログエントリの型定義
 */
export interface AuditLogEntry {
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  error_message?: string;
  response_status?: number;
}

/**
 * 監査ログをデータベースに記録する
 *
 * @param c - Honoコンテキスト
 * @param entry - ログエントリ
 *
 * @example
 * ```typescript
 * await logAudit(c, {
 *   action: 'DONATION_CREATE',
 *   table_name: 'donations',
 *   record_id: donation.id,
 *   new_values: donation
 * });
 * ```
 */
export const logAudit = async <T extends { Bindings: Env }>(
  c: Context<T>,
  entry: AuditLogEntry
): Promise<void> => {
  try {
    const supabase = createSupabaseClient(c.env);

    // コンテキストからユーザー情報を取得（未設定の場合はnull）
    // anyを使用してVariables型の制約を回避
    const contextAny = c as { var?: Record<string, unknown> };
    const userId = (contextAny.var?.userId as string) ?? null;
    const user = contextAny.var?.user as { email?: string } | undefined;
    const userEmail = user?.email ?? null;

    const logData = {
      user_id: userId,
      user_email: userEmail,
      action: entry.action,
      table_name: entry.table_name ?? null,
      record_id: entry.record_id ?? null,
      old_values: entry.old_values ?? null,
      new_values: entry.new_values ?? null,
      ip_address: c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null,
      user_agent: c.req.header("User-Agent") ?? null,
      request_path: c.req.path,
      request_method: c.req.method,
      response_status: entry.response_status ?? null,
      error_message: entry.error_message ?? null,
    };

    await supabase.from("audit_logs").insert(logData);
  } catch (error) {
    // ログ記録の失敗はメイン処理に影響させない
    // Cloudflare Workers のコンソールに出力
    // eslint-disable-next-line no-console
    console.error("Failed to write audit log:", error);
  }
};

/**
 * 認証イベントをログに記録するヘルパー関数
 */
export const logAuthEvent = async <T extends { Bindings: Env }>(
  c: Context<T>,
  action: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "LOGOUT" | "AUTH_ERROR",
  errorMessage?: string
): Promise<void> => {
  await logAudit(c, {
    action,
    error_message: errorMessage,
  });
};

/**
 * CRUD操作をログに記録するヘルパー関数
 */
export const logCrudOperation = async <T extends { Bindings: Env }>(
  c: Context<T>,
  action: "DONATION_CREATE" | "DONATION_UPDATE" | "DONATION_DELETE" | "LENDING_CREATE" | "LENDING_RETURN",
  tableName: string,
  recordId: string,
  options?: {
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }
): Promise<void> => {
  await logAudit(c, {
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: options?.oldValues,
    new_values: options?.newValues,
  });
};

/**
 * APIエラーをログに記録するヘルパー関数
 */
export const logApiError = async <T extends { Bindings: Env }>(
  c: Context<T>,
  errorMessage: string,
  responseStatus: number
): Promise<void> => {
  await logAudit(c, {
    action: "API_ERROR",
    error_message: errorMessage,
    response_status: responseStatus,
  });
};
