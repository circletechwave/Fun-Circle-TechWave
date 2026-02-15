import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";
import { logCrudOperation, logApiError } from "../lib/auditLog";

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
                            sub_category_id: z.string().nullable().optional(),
                            location_id: z.string(),
                            status: z.enum(["available", "lending", "maintenance", "lost"]),
                            condition: z.enum(["new", "good", "fair", "poor"]).optional(),
                            description: z.string().nullable().optional(),
                            donor_name: z.string().nullable().optional(),
                            donated_date: z.string(),
                            image_url: z.string().nullable().optional(),
                            image_urls: z.array(z.string()).optional(),
                            // タグはIDの配列またはオブジェクトの配列を受け入れる
                            tags: z.array(z.union([
                                z.string(),
                                z.object({ id: z.string(), name: z.string().optional() })
                            ])).optional(),
                            // 書籍情報
                            isbn: z.string().nullable().optional(),
                            author: z.string().nullable().optional(),
                            publisher: z.string().nullable().optional(),
                            published_year: z.number().nullable().optional(),
                            // 製品情報
                            manufacturer: z.string().nullable().optional(),
                            model_number: z.string().nullable().optional(),
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

        // For now, use a dummy user ID for created_by since we don't have auth middleware yet
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
                // 書籍情報
                isbn: donation.isbn,
                author: donation.author,
                publisher: donation.publisher,
                published_year: donation.published_year,
                // 製品情報
                manufacturer: donation.manufacturer,
                model_number: donation.model_number,
            })
            .select('id')
            .single();

        if (error) {
            await logApiError(c, error.message, 500);
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
            // タグがオブジェクトの場合はIDを抽出、文字列の場合はそのまま使用
            const tagIds = donation.tags.map(tag =>
                typeof tag === 'string' ? tag : tag.id
            );
            const tagsToInsert = tagIds.map(tagId => ({
                donation_id: newDonation.id,
                tag_id: tagId
            }));
            await supabase.from('donation_tags').insert(tagsToInsert);
        }

        // 監査ログ記録
        await logCrudOperation(c, "DONATION_CREATE", "donations", newDonation.id, {
            newValues: {
                title: donation.title,
                category_id: donation.category_id,
                status: donation.status,
            },
        });

        return c.json({
            success: true,
            data: newDonation,
        });
    }
}
