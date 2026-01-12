import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

export class DonationCreate extends OpenAPIRoute {
    schema = {
        tags: ["Donations"],
        summary: "Create a new donation",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string(),
                            category_id: z.string(),
                            sub_category_id: z.string().optional(),
                            location_id: z.string(),
                            status: z.enum(["available", "lending", "maintenance", "lost"]),
                            condition: z.enum(["new", "good", "fair", "poor"]).optional(),
                            description: z.string().optional(),
                            donor_name: z.string().optional(),
                            donated_date: z.string(),
                            image_url: z.string().optional(),
                            image_urls: z.array(z.string()).optional(),
                            tags: z.array(z.string()).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Donation created successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.object({
                                id: z.string(),
                            }),
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
        const donation = data.body;
        const supabase = createSupabaseClient(c.env);

        // TODO: [Phase 2] 認証ミドルウェアを実装して、ユーザーIDを取得する
        // 現在はダミーユーザーIDを使用しているが、本番環境では削除すること
        // 実装方法:
        // 1. リクエストヘッダーからAuthorizationトークンを取得
        // 2. Supabaseの auth.getUser() でユーザー情報を取得
        // 3. ユーザーIDを created_by に設定
        const DUMMY_USER_ID = '00000000-0000-4000-8000-000000000001';

        const { data: newDonation, error } = await supabase
            .from('donations')
            .insert({
                title: donation.title,
                category_id: donation.category_id,
                sub_category_id: donation.sub_category_id,
                location_id: donation.location_id,
                status: donation.status,
                condition: donation.condition,
                description: donation.description,
                donor_name: donation.donor_name,
                donated_date: donation.donated_date,
                created_by: DUMMY_USER_ID,
            })
            .select('id')
            .single();

        if (error) {
            return c.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        if (donation.image_urls && donation.image_urls.length > 0) {
            const imagesToInsert = donation.image_urls.map((url, index) => ({
                donation_id: newDonation.id,
                image_url: url,
                display_order: index + 1
            }));
            await supabase.from('donation_images').insert(imagesToInsert);
        } else if (donation.image_url) {
            await supabase.from('donation_images').insert({
                donation_id: newDonation.id,
                image_url: donation.image_url,
                display_order: 1
            });
        }

        if (donation.tags && donation.tags.length > 0) {
            const tagsToInsert = donation.tags.map(tagId => ({
                donation_id: newDonation.id,
                tag_id: tagId
            }));
            await supabase.from('donation_tags').insert(tagsToInsert);
        }

        return c.json({
            success: true,
            data: newDonation,
        });
    }
}
