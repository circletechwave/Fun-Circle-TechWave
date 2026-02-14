import type { Context, Next } from "hono";
import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "../lib/supabase";
import type { Env } from "../types";

/**
 * 認証済みユーザー情報を含むコンテキスト変数
 */
export interface AuthVariables {
  user: User;
  userId: string;
  userEmail: string;
}

/**
 * 認証ミドルウェア
 * - Authorization ヘッダーからBearerトークンを取得
 * - Supabase Authでトークンを検証
 * - ユーザー情報をコンテキストに保存
 */
export const authMiddleware = async (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next
): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        success: false,
        error: "認証が必要です",
        code: "AUTH_REQUIRED",
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return c.json(
      {
        success: false,
        error: "認証トークンが必要です",
        code: "TOKEN_REQUIRED",
      },
      401
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json(
        {
          success: false,
          error: "無効なトークンです",
          code: "INVALID_TOKEN",
        },
        401
      );
    }

    c.set("user", user);
    c.set("userId", user.id);
    c.set("userEmail", user.email ?? "");

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "認証処理に失敗しました",
        code: "AUTH_ERROR",
      },
      500
    );
  }
};
