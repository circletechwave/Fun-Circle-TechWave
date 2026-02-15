import { OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

export class AuditLogList extends OpenAPIRoute {
	schema = {
		tags: ["Admin"],
		summary: "Get audit logs (admin only)",
		request: {
			query: z.object({
				page: Num({ description: "Page number", default: 1 }),
				per_page: Num({ description: "Items per page", default: 50 }),
				action: Str({ description: "Filter by action", required: false }),
				user_id: Str({ description: "Filter by user ID", required: false }),
				table_name: Str({ description: "Filter by table name", required: false }),
				date_from: Str({ description: "Filter from date (YYYY-MM-DD)", required: false }),
				date_to: Str({ description: "Filter to date (YYYY-MM-DD)", required: false }),
				keyword: Str({ description: "Search keyword", required: false }),
			}),
		},
		responses: {
			"200": {
				description: "Audit logs retrieved successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.array(z.any()),
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
			},
			"403": {
				description: "Forbidden - admin access required",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const supabase = createSupabaseClient(c.env);

		// 認証チェック
		const authHeader = c.req.header("Authorization");
		if (!authHeader) {
			return c.json({ success: false, error: "認証が必要です" }, 401);
		}

		const token = authHeader.replace("Bearer ", "");
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);

		if (authError || !user) {
			return c.json({ success: false, error: "認証が必要です" }, 401);
		}

		// 管理者権限チェック
		const { data: userData } = await supabase
			.from("users")
			.select("role")
			.eq("id", user.id)
			.single();

		if (!userData || !["admin", "system"].includes(userData.role)) {
			return c.json({ success: false, error: "管理者権限が必要です" }, 403);
		}

		// クエリパラメータ取得
		const {
			page = 1,
			per_page = 50,
			action,
			user_id,
			table_name,
			date_from,
			date_to,
			keyword,
		} = data.query;

		// ベースクエリ
		let query = supabase
			.from("audit_logs")
			.select("*", { count: "exact" })
			.order("created_at", { ascending: false });

		// フィルター適用
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
			query = query.gte("created_at", `${date_from}T00:00:00Z`);
		}
		if (date_to) {
			query = query.lte("created_at", `${date_to}T23:59:59Z`);
		}
		if (keyword) {
			query = query.or(
				`user_email.ilike.%${keyword}%,request_path.ilike.%${keyword}%,error_message.ilike.%${keyword}%`
			);
		}

		// ページネーション
		const from = (page - 1) * per_page;
		const to = from + per_page - 1;

		const { data: logs, error, count } = await query.range(from, to);

		if (error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				500
			);
		}

		const total = count || 0;
		const total_pages = Math.ceil(total / per_page);

		return c.json({
			success: true,
			data: logs || [],
			pagination: {
				page,
				per_page,
				total,
				total_pages,
			},
		});
	}
}
