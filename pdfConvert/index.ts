import { AzureFunction, Context } from "@azure/functions"
import { fromBuffer } from "pdf2pic";
import { ToBase64Response } from "pdf2pic/dist/types/toBase64Response";

const blobTrigger: AzureFunction = async function (context: Context, inputBlob: any): Promise<void> {
    context.log("Blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", inputBlob.length, "Bytes");
    const pdfResponse = (await fromBuffer(inputBlob)(1, true))as ToBase64Response;
    context.log(pdfResponse);
    const imageBuffer = decodeBase64Image(pdfResponse.base64);
    context.bindings.imageBlob = imageBuffer.data;
};

function decodeBase64Image(dataString: string) {
    const matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
      response = { type: undefined, data: undefined };
  
    if (matches.length !== 3) {
      throw new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');
  
    return response;
  }

export default blobTrigger;
