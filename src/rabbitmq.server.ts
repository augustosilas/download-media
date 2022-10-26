import { connect, Channel } from "amqplib";
import { DownloaderController } from "./controllers/downloader";

export class RabbitmqServer {
  private url: string;
  private channel: Channel;

  private static instance: RabbitmqServer;
  private constructor() {
    this.url = process.env.RABBITMQ_URL!;
    this.channel = {} as Channel;
  }

  static getInstance(): RabbitmqServer {
    if (RabbitmqServer.instance) return RabbitmqServer.instance;
    return (RabbitmqServer.instance = new RabbitmqServer());
  }

  async start(): Promise<void> {
    const connection = await connect(this.url);
    this.channel = await connection.createChannel();

    await this.createRequiredExchange();
    await this.createRequiredQueues(["downloadMp3"]);
    await this.consumeFromQueue();
  }

  async createRequiredExchange(): Promise<void> {
    await this.channel.assertExchange(process.env.RABBITMQ_EXCHANGE!, "topic");
  }

  async createRequiredQueues(queues: Array<string>): Promise<void> {
    for (const queue of queues) {
      await this.channel.assertQueue(queue, {
        durable: true,
        autoDelete: false,
      });
      await this.channel.bindQueue(
        queue,
        process.env.RABBITMQ_EXCHANGE!,
        process.env.RABBITMQ_ROUTE_KEY!
      );
    }
  }

  async publishOnExchange(
    exchange: string,
    routeKey: string,
    message: any
  ): Promise<void> {
    this.channel.publish(exchange, routeKey, Buffer.from(message));
  }

  async consumeFromQueue(): Promise<void> {
    const queues = [
      {
        name: "downloadMp3",
        controller: new DownloaderController(),
      },
    ];

    for (const queue of queues) {
      this.channel.consume(
        queue.name,
        queue.controller[queue.name].bind(queue.controller)
      );
    }
  }

  ack({ fields, content, properties }) {
    this.channel.ack({ fields, content, properties });
  }

  nack({ fields, content, properties }) {
    this.channel.nack({ fields, content, properties });
  }
}
