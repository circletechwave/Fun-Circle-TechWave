import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

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

        const { error } = await supabase
            .from('donations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            return c.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        return c.json({
            success: true,
        });
    }
}
