import { AzureFunction, Context } from "@azure/functions"
import { fromBuffer } from "pdf2pic";
import { ToBase64Response } from "pdf2pic/dist/types/toBase64Response";

const blobTrigger: AzureFunction = async function (context: Context, inputBlob: any): Promise<void> {
    context.log("Blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", inputBlob.length, "Bytes");
    const pdfResponse = (await fromBuffer(inputBlob,{width:425, height:600})(1, true))as ToBase64Response;
    context.log(pdfResponse);
    const imageBuffer = Buffer.from(pdfResponse.base64, 'base64');
    context.bindings.imageBlob = imageBuffer;
};

export default blobTrigger;
