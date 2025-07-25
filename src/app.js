import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import { addTokenRefreshHeaders } from "./middlewares/auth.middleware.js";

//global middleware for token refresh headers
app.use(addTokenRefreshHeaders);

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);

// http://localhost:8000/api/v1/users/login

export { app };
