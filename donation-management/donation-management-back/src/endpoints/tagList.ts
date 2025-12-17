import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

export class TagList extends OpenAPIRoute {
    schema = {
        tags: ["Tags"],
        summary: "List all tags",
        responses: {
            "200": {
                description: "Returns a list of tags",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(z.object({
                                id: z.string(),
                                name: z.string(),
                            })),
                        }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const supabase = createSupabaseClient(c.env);

        const { data: tags, error } = await supabase
            .from('tags')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            return c.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        return c.json({
            success: true,
            data: tags || [],
        });
    }
}
