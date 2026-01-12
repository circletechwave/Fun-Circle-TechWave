import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Task } from "../types";

export class TaskFetch extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Get a single Task by slug",
		request: {
			params: z.object({
				taskSlug: Str({ description: "Task slug" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a single task if found",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									task: Task,
								}),
							}),
						}),
					},
				},
			},
			"404": {
				description: "Task not found",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								error: Str(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();

		// Retrieve the validated slug
		const { taskSlug } = data.params;

		// TODO: Implement your own object fetch here
		// 現在はプレースホルダーとして常にtrueを返している
		const exists: boolean = true;

		if (!exists) {
			return Response.json(
				{
					success: false,
					error: "Object not found",
				},
				{
					status: 404,
				},
			);
		}

		return {
			success: true,
			task: {
				name: "my task",
				slug: taskSlug,
				description: "this needs to be done",
				completed: false,
				due_date: new Date().toISOString().slice(0, 10),
			},
		};
	}
}
