
import { verifyMessage, isAddress } from "viem";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Controllo stato del servizio
    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        service: "SANGISOUND Wallet Verification",
        status: "ready",
        signatureVerification: "enabled"
      });
    }

    // Verifica crittografica della firma Ethereum
    if (url.pathname === "/verify" && request.method === "POST") {
      try {
        const length = Number(
          request.headers.get("Content-Length") || 0
        );

        if (length > 8192) {
          return json({
            valid: false,
            error: "Richiesta troppo grande."
          }, 413);
        }

        const raw = await request.text();

        if (raw.length > 8192) {
          return json({
            valid: false,
            error: "Richiesta troppo grande."
          }, 413);
        }

        let body;

        try {
          body = JSON.parse(raw);
        } catch {
          return json({
            valid: false,
            error: "JSON non valido."
          }, 400);
        }

        const { address, message, signature } = body || {};

        if (
          typeof address !== "string" ||
          !isAddress(address) ||
          typeof message !== "string" ||
          message.length < 1 ||
          message.length > 2048 ||
          typeof signature !== "string" ||
          !/^0x[0-9a-fA-F]+$/.test(signature) ||
          signature.length > 4096
        ) {
          return json({
            valid: false,
            error: "Parametri della firma non validi."
          }, 400);
        }

        const valid = await verifyMessage({
          address,
          message,
          signature
        });

        return json({ valid });

      } catch (error) {
        console.error("Signature verification error:", error);

        return json({
          valid: false,
          error: "Impossibile verificare la firma."
        }, 400);
      }
    }

    return json({
      error: "Endpoint non disponibile."
    }, 404);
  }
};
