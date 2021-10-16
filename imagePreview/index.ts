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
    context.bindingData.name,
    "\n Blob Size:",
    inputBlob.length,
    "Bytes"
  );
  context.log(JSON.stringify(context.bindingData));
  const image = sharp(inputBlob);
  const metadata = await image.metadata();
  const ratio = metadata.width / metadata.height;
  const cols = ratio > 1.25 ? 2 : 1;
  const rows = ratio < 0.75 ? 2 : 1;
  try{
    const thumbnail = await computerVisionClient.generateThumbnail(
        400 * cols,
        400 * rows,
        context.bindingData.uri,
        {
          smartCropping: true,
        }
      );
      const chunks = [];
      const thumbnailStream = thumbnail.readableStreamBody;
      thumbnailStream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      thumbnailStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        context.bindings.outputBlob = buffer;
      });
  } catch (error) {
    context.log.error(error);
  }
};

export default blobTrigger;
