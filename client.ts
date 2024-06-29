import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import readline from "readline";

async function main() {
  const correlationMap: { [key in string]: string | null } = {};
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const rpcQueue = "rpc_queue";
  const connection = await connect("amqp://localhost");
  const channel = await connection.createChannel();
  const replyQueue = await channel.assertQueue("", { exclusive: true });

  channel.consume(
    replyQueue.queue,
    (message) => {
      if (
        !message ||
        correlationMap[message.properties.correlationId] === undefined
      ) {
        return;
      }

      const result = message.content.toString();
      correlationMap[message.properties.correlationId] = result;

      console.log(result);
    },
    { noAck: true },
  );

  readlineInterface.on("line", (line) => {
    const correlationId = uuidv4();

    correlationMap[correlationId] = null;

    channel.sendToQueue(rpcQueue, Buffer.from(line), {
      correlationId,
      replyTo: replyQueue.queue,
    });
  });
}

main();
