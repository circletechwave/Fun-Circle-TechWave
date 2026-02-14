import type { Context, Next } from "hono";
import { createSupabaseClient } from "../lib/supabase";
import { logAudit } from "../lib/auditLog";
import type { Env } from "../types";
import type { AuthVariables } from "./auth";

/**
 * 管理者認証済みユーザー情報を含むコンテキスト変数
 */
export interface AdminAuthVariables extends AuthVariables {
  userRole: "admin" | "system";
}

type UserRole = "user" | "admin" | "system";

/**
 * 管理者権限ミドルウェア
 * - authMiddleware の後に使用すること
 * - ユーザーのロールを確認し、admin または system のみアクセス許可
 * - 権限エラー時は監査ログに記録
 */
export const requireAdmin = async (
  c: Context<{ Bindings: Env; Variables: AdminAuthVariables }>,
  next: Next
): Promise<Response | void> => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json(
      {
        success: false,
        error: "認証が必要です",
        code: "AUTH_REQUIRED",
      },
      401
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !userData) {
      return c.json(
        {
          success: false,
          error: "ユーザー情報が見つかりません",
          code: "USER_NOT_FOUND",
        },
        404
      );
    }

    const role = userData.role as UserRole;

    if (!["admin", "system"].includes(role)) {
      // 権限エラーをログに記録（型を合わせるため直接insertを使用）
      const auditSupabase = createSupabaseClient(c.env);
      await auditSupabase.from("audit_logs").insert({
        user_id: userId,
        user_email: c.get("userEmail") ?? null,
        action: "PERMISSION_DENIED",
        ip_address: c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null,
        user_agent: c.req.header("User-Agent") ?? null,
        request_path: c.req.path,
        request_method: c.req.method,
        error_message: `管理者権限が必要です。現在のロール: ${role}`,
      });

      return c.json(
        {
          success: false,
          error: "管理者権限が必要です",
          code: "ADMIN_REQUIRED",
        },
        403
      );
    }

    c.set("userRole", role as "admin" | "system");

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "権限チェックに失敗しました",
        code: "PERMISSION_CHECK_ERROR",
      },
      500
    );
  }
};
