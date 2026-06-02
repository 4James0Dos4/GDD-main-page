import type { APIRoute } from "astro";
import { createReadStream } from "node:fs";
import path from "node:path";
import { stat } from "node:fs/promises";
import { getAudiobookById } from "../../../data/audiobooks";
import { consumeDownloadToken } from "../../../lib/downloadTokens";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const plainToken = params.token;
  if (!plainToken) {
    return new Response("Brak tokenu.", { status: 400 });
  }

  const record = await consumeDownloadToken(plainToken);
  if (!record) {
    return new Response("Link wygasł lub został już użyty.", { status: 410 });
  }

  const product = getAudiobookById(record.productId);
  if (!product) {
    return new Response("Produkt nie istnieje.", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "private", "audiobooks", product.fileName);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new Response("Plik niedostępny.", { status: 404 });
    }
  } catch {
    return new Response("Plik niedostępny.", { status: 404 });
  }

  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (error) => controller.error(error));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename="${product.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
};
