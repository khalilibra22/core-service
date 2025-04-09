import express, { Request, Response } from "express";
import { AppDataSource } from "../config/database";

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  AppDataSource;
});

export default app;
