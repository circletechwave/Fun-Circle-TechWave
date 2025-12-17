import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createSupabaseClient } from "../lib/supabase";

export class DonationUpdate extends OpenAPIRoute {
    schema = {
        tags: ["Donations"],
        summary: "Update a donation",
        request: {
            params: z.object({
                id: Str({ description: "Donation ID" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().optional(),
                            category_id: z.string().optional(),
                            sub_category_id: z.string().optional(),
                            location_id: z.string().optional(),
                            status: z.enum(["available", "lending", "maintenance", "lost"]).optional(),
                            condition: z.enum(["new", "good", "fair", "poor"]).optional(),
                            description: z.string().optional(),
                            donor_name: z.string().optional(),
                            donated_date: z.string().optional(),
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
                description: "Donation updated successfully",
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
        const { id } = data.params;
        const donation = data.body;
        const supabase = createSupabaseClient(c.env);

        // Remove image_url, image_urls, tags from donation object before updating donations table
        const { image_url, image_urls, tags, ...updateData } = donation;

        const { data: updatedDonation, error } = await supabase
            .from('donations')
            .update(updateData)
            .eq('id', id)
            .select('id')
            .single();

        if (error) {
            return c.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        if (image_urls) {
            // Delete existing images
            await supabase.from('donation_images').delete().eq('donation_id', id);

            // Insert new images
            if (image_urls.length > 0) {
                const imagesToInsert = image_urls.map((url, index) => ({
                    donation_id: id,
                    image_url: url,
                    display_order: index + 1
                }));
                await supabase.from('donation_images').insert(imagesToInsert);
            }
        } else if (image_url) {
            // Check if image exists
            const { data: existingImages } = await supabase
                .from('donation_images')
                .select('id')
                .eq('donation_id', id);

            if (existingImages && existingImages.length > 0) {
                // Update the first image
                await supabase
                    .from('donation_images')
                    .update({ image_url })
                    .eq('id', existingImages[0].id);
            } else {
                await supabase
                    .from('donation_images')
                    .insert({
                        donation_id: id,
                        image_url,
                        display_order: 1
                    });
            }
        }

        if (tags) {
            // Delete existing tags
            await supabase.from('donation_tags').delete().eq('donation_id', id);

            // Insert new tags
            if (tags.length > 0) {
                const tagsToInsert = tags.map(tagId => ({
                    donation_id: id,
                    tag_id: tagId
                }));
                await supabase.from('donation_tags').insert(tagsToInsert);
            }
        }

        return c.json({
            success: true,
            data: updatedDonation,
        });
    }
}
