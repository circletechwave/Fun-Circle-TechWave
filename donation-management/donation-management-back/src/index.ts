import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { DonationList } from "./endpoints/donationList";
import { DonationCreate } from "./endpoints/donationCreate";
import { DonationFetch } from "./endpoints/donationFetch";
import { DonationUpdate } from "./endpoints/donationUpdate";
import { DonationDelete } from "./endpoints/donationDelete";
import { CategoryList } from "./endpoints/categoryList";
import { LocationList } from "./endpoints/locationList";
import { TagList } from "./endpoints/tagList";
import { AuditLogList } from "./endpoints/auditLogList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Add CORS middleware
app.use("/api/*", cors());

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Donation management endpoints
openapi.get("/api/donations", DonationList);
openapi.post("/api/donations", DonationCreate);
openapi.get("/api/donations/:id", DonationFetch);
openapi.put("/api/donations/:id", DonationUpdate);
openapi.delete("/api/donations/:id", DonationDelete);

openapi.get("/api/categories", CategoryList);
openapi.get("/api/locations", LocationList);
openapi.get("/api/tags", TagList);

// Admin endpoints
openapi.get("/api/admin/audit-logs", AuditLogList);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
