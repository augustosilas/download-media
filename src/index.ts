import { config } from "dotenv";
config();

import express from "express";
import { RabbitmqServer } from "./rabbitmq.server";
const PORT = process.env.PORT || 5000;

const app = express();

RabbitmqServer.getInstance().start().then().catch(console.error);

app.listen(PORT, () => console.log(`running server on port ${PORT}`));
