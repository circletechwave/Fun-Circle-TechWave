import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";
import { logCrudOperation, logApiError } from "../lib/auditLog";

export class DonationDelete extends OpenAPIRoute {
    schema = {
        tags: ["Donations"],
        summary: "Delete a donation (soft delete)",
        request: {
            params: z.object({
                id: Str({ description: "Donation ID" }),
            }),
        },
        responses: {
            "200": {
                description: "Donation deleted successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                        }),
                    },
                },
            },
            "500": {
                description: "Internal Server Error",
            },
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { id } = data.params;
        const supabase = createSupabaseClient(c.env);

        // 削除前のデータを取得（監査ログ用）
        const { data: oldDonation } = await supabase
            .from('donations')
            .select('title, category_id, status')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('donations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            await logApiError(c, error.message, 500);
            return c.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        // 監査ログ記録
        await logCrudOperation(c, "DONATION_DELETE", "donations", id, {
            oldValues: oldDonation ?? undefined,
        });

        return c.json({
            success: true,
        });
    }
}
