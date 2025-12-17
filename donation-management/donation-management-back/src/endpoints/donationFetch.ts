import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

export class DonationFetch extends OpenAPIRoute {
    schema = {
        tags: ["Donations"],
        summary: "Get a donation by ID",
        request: {
            params: z.object({
                id: Str({ description: "Donation ID" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a single donation",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.object({
                                id: z.string(),
                                title: z.string(),
                                category_id: z.string(),
                                category: z.object({
                                    id: z.string(),
                                    name: z.string(),
                                }),
                                sub_category_id: z.string().optional(),
                                sub_category: z.object({
                                    id: z.string(),
                                    name: z.string(),
                                }).optional(),
                                status: z.enum(["available", "lending", "maintenance", "lost"]),
                                location_id: z.string(),
                                location: z.object({
                                    id: z.string(),
                                    name: z.string(),
                                }),
                                donor_name: z.string().optional(),
                                donated_date: z.string(),
                                description: z.string().optional(),
                                condition: z.enum(["new", "good", "fair", "poor"]).optional(),
                                isbn: z.string().optional(),
                                author: z.string().optional(),
                                publisher: z.string().optional(),
                                published_year: z.number().optional(),
                                manufacturer: z.string().optional(),
                                model_number: z.string().optional(),
                                image_url: z.string().optional(),
                                created_at: z.string(),
                                updated_at: z.string(),
                            }),
                        }),
                    },
                },
            },
            "404": {
                description: "Donation not found",
            },
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { id } = data.params;
        const supabase = createSupabaseClient(c.env);

        const { data: donation, error } = await supabase
            .from('donations')
            .select(`
				*,
				categories!inner(id, name),
				sub_categories(id, name),
				locations!inner(id, name)
			`)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !donation) {
            return c.json({
                success: false,
                error: "Donation not found",
            }, { status: 404 });
        }

        const transformedData = {
            id: donation.id,
            title: donation.title,
            category_id: donation.category_id,
            category: {
                id: donation.categories.id,
                name: donation.categories.name,
            },
            sub_category_id: donation.sub_category_id,
            sub_category: donation.sub_categories ? {
                id: donation.sub_categories.id,
                name: donation.sub_categories.name,
            } : undefined,
            status: donation.status,
            location_id: donation.location_id,
            location: {
                id: donation.locations.id,
                name: donation.locations.name,
            },
            donor_name: donation.donor_name,
            donated_date: donation.donated_date,
            description: donation.description,
            condition: donation.condition,
            isbn: donation.isbn,
            author: donation.author,
            publisher: donation.publisher,
            published_year: donation.published_year,
            manufacturer: donation.manufacturer,
            model_number: donation.model_number,
            // TODO: Fetch image URL from donation_images table
            image_url: undefined,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
        };

        return c.json({
            success: true,
            data: transformedData,
        });
    }
}
