import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import { EventListener } from "./services/EventListener";
import loanRoutes from "./routes/loans";

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/loans', loanRoutes);

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        const eventListener = new EventListener();
        await eventListener.startListening();
        console.log("Event listener started");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}

startServer();
