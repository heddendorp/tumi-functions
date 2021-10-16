import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { AzureFunction, Context } from "@azure/functions";
import sharp = require("sharp");

const key = process.env.VISION_KEY;
const endpoint = process.env.VISION_ENDPOINT;
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
  endpoint
);

const blobTrigger: AzureFunction = async function (
  context: Context,
  inputBlob: any
): Promise<void> {
  context.log(
    "Blob trigger function processed blob \n Name:",
    context.bindingData.blobTrigger,
    "\n Blob Size:",
    inputBlob.length,
    "Bytes"
  );
  if (context.bindingData.blobTrigger.endsWith("preview.jpg")) {
    context.log.info("This is a preview image");
    return;
  }
  context.log("\n" + JSON.stringify(context.bindingData) + "\n");
  const image = sharp(inputBlob);
  const { data, info } = await image
    .rotate()
    .jpeg()
    .toBuffer({ resolveWithObject: true });
  context.log("\n" + JSON.stringify(info) + "\n");
  const ratio = info.width / info.height;
  const cols = ratio >= 1.25 ? 2 : 1;
  const rows = ratio <= 0.75 ? 2 : 1;
  context.log(`Image data
  height: ${info.height}
  width: ${info.width}
  ratio: ${ratio}
  cols: ${cols}
  rows: ${rows}
  `);
  try {
    const thumbnail = await computerVisionClient.generateThumbnailInStream(
      400 * cols,
      400 * rows,
      data
    );
    const chunks = [];
    const thumbnailStream = thumbnail.readableStreamBody;
    thumbnailStream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    try {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        thumbnailStream.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        thumbnailStream.on("error", (err) => {
          reject(err);
        });
      });
      context.log(`Output length:  ${buffer.length}`);
      const meta2 = await sharp(buffer).metadata();
      context.log(`Image data
  height: ${meta2.height}
  width: ${meta2.width}
  `);
      context.bindings.imageBlob = buffer;
    } catch (err) {
      context.log.error(err);
    }
  } catch (error) {
    context.log.error(error);
  }
};

export default blobTrigger;
