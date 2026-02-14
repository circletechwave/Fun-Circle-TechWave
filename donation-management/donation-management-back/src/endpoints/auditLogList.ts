import { Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

/**
 * 監査ログ一覧取得エンドポイント
 *
 * 管理者専用エンドポイント（requireAdminミドルウェアで保護）
 * フィルター、検索、ページネーションに対応
 */
export class AuditLogList extends OpenAPIRoute {
  schema = {
    tags: ["Admin"],
    summary: "List audit logs (admin only)",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        page: Num({
          description: "Page number (starts from 1)",
          default: 1,
        }),
        per_page: Num({
          description: "Items per page",
          default: 50,
        }),
        action: z
          .enum([
            "LOGIN_SUCCESS",
            "LOGIN_FAILURE",
            "LOGOUT",
            "AUTH_ERROR",
            "PERMISSION_DENIED",
            "DONATION_CREATE",
            "DONATION_UPDATE",
            "DONATION_DELETE",
            "LENDING_CREATE",
            "LENDING_RETURN",
            "API_ERROR",
          ])
          .optional()
          .describe("Filter by action type"),
        user_id: Str({
          description: "Filter by user ID",
          required: false,
        }),
        table_name: Str({
          description: "Filter by table name",
          required: false,
        }),
        date_from: Str({
          description: "Filter by start date (ISO 8601 format)",
          required: false,
        }),
        date_to: Str({
          description: "Filter by end date (ISO 8601 format)",
          required: false,
        }),
        keyword: Str({
          description: "Keyword search in user_email, request_path, error_message",
          required: false,
        }),
      }),
    },
    responses: {
      "200": {
        description: "Returns a paginated list of audit logs",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              data: z.array(
                z.object({
                  id: z.string(),
                  user_id: z.string().nullable(),
                  user_email: z.string().nullable(),
                  action: z.string(),
                  table_name: z.string().nullable(),
                  record_id: z.string().nullable(),
                  old_values: z.record(z.unknown()).nullable(),
                  new_values: z.record(z.unknown()).nullable(),
                  ip_address: z.string().nullable(),
                  user_agent: z.string().nullable(),
                  request_path: z.string().nullable(),
                  request_method: z.string().nullable(),
                  response_status: z.number().nullable(),
                  error_message: z.string().nullable(),
                  created_at: z.string(),
                })
              ),
              pagination: z.object({
                page: z.number(),
                per_page: z.number(),
                total: z.number(),
                total_pages: z.number(),
              }),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
              code: z.string(),
            }),
          },
        },
      },
      "403": {
        description: "Forbidden - Admin access required",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
              code: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { page, per_page, action, user_id, table_name, date_from, date_to, keyword } =
      data.query;

    const supabase = createSupabaseClient(c.env);

    let query = supabase
      .from("audit_logs")
      .select(
        `
        id,
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        request_path,
        request_method,
        response_status,
        error_message,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq("action", action);
    }
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    if (table_name) {
      query = query.eq("table_name", table_name);
    }
    if (date_from) {
      query = query.gte("created_at", date_from);
    }
    if (date_to) {
      query = query.lte("created_at", date_to);
    }
    if (keyword) {
      query = query.or(
        `user_email.ilike.%${keyword}%,request_path.ilike.%${keyword}%,error_message.ilike.%${keyword}%`
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true });

    if (action) {
      countQuery = countQuery.eq("action", action);
    }
    if (user_id) {
      countQuery = countQuery.eq("user_id", user_id);
    }
    if (table_name) {
      countQuery = countQuery.eq("table_name", table_name);
    }
    if (date_from) {
      countQuery = countQuery.gte("created_at", date_from);
    }
    if (date_to) {
      countQuery = countQuery.lte("created_at", date_to);
    }
    if (keyword) {
      countQuery = countQuery.or(
        `user_email.ilike.%${keyword}%,request_path.ilike.%${keyword}%,error_message.ilike.%${keyword}%`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      return c.json(
        {
          success: false,
          error: countError.message,
        },
        { status: 500 }
      );
    }

    // Apply pagination
    const offset = (page - 1) * per_page;
    query = query.range(offset, offset + per_page - 1);

    const { data: logs, error } = await query;

    if (error) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((totalCount ?? 0) / per_page);

    return c.json({
      success: true,
      data: logs ?? [],
      pagination: {
        page,
        per_page,
        total: totalCount ?? 0,
        total_pages: totalPages,
      },
    });
  }
}
