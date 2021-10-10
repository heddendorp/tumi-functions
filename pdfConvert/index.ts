import { AzureFunction, Context } from "@azure/functions";
import { fromBuffer } from "pdf2pic";
import { ToBase64Response } from "pdf2pic/dist/types/toBase64Response";
import sharp = require("sharp");

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
  const pdfResponse = (await fromBuffer(inputBlob, {
    width: 425,
    height: 600,
  }).bulk(-1, true)) as ToBase64Response[];
  context.log(pdfResponse.length);
  const image = await sharp({
    create: {
      width: 425,
      height: 600 * pdfResponse.length,
      channels: 3,
      background: "white",
    },
  })
    .composite(
      pdfResponse.map(({ base64 }, index) => ({
        input: Buffer.from(base64, "base64"),
        top: index * 600,
        left: 0,
      }))
    )
    .png()
    .toBuffer();
  const imageBuffer = image;
  context.bindings.imageBlob = imageBuffer;
};

export default blobTrigger;
