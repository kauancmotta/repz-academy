import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiDocument } from "./docs/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { router } from "./routes.js";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);
