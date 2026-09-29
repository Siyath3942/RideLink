import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rideRoutes from "./routes/rideRoutes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "ride-management-service",
    message: "Ride Management Service is running"
  });
});

app.use("/api/v1/rides", rideRoutes);

export default app;
