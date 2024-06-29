import { connect } from "amqplib";

async function main() {
  const rpcQueue = "rpc_queue";
  const connection = await connect("amqp://localhost");
  const channel = await connection.createChannel();

  await channel.assertQueue(rpcQueue, { durable: false });

  channel.prefetch(1);

  channel.consume(rpcQueue, async (message) => {
    if (!message) {
      return;
    }

    channel.sendToQueue(
      message.properties.replyTo,
      Buffer.from(`${message.content.length}`),
      {
        correlationId: message.properties.correlationId,
      },
    );

    channel.ack(message);
  });
}

main();
