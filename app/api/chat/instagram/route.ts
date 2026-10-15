
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    console.log("Instagram webhook received.");

    if (!accessToken) {
      console.error("INSTAGRAM_ACCESS_TOKEN is missing.");
      return NextResponse.json(
        { error: "Instagram access token is not configured." },
        { status: 500 }
      );
    }

    const events: any[] = [];

    if (Array.isArray(body?.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry?.messaging)) {
          events.push(...entry.messaging);
        }

        if (Array.isArray(entry?.changes)) {
          for (const change of entry.changes) {
            if (
              change?.field === "messages" &&
              change?.value
            ) {
              events.push(change.value);
            }
          }
        }
      }
    }

    if (body?.field === "messages" && body?.value) {
      events.push(body.value);
    } else if (body?.sender && body?.message) {
      events.push(body);
    }

    console.log("Instagram events found:", events.length);

    for (const event of events) {
      const senderId = event?.sender?.id;
      const message = event?.message;
      const text =
        typeof message?.text === "string"
          ? message.text.trim()
          : "";

      if (
        !senderId ||
        !text ||
        message?.is_echo ||
        event?.is_echo
      ) {
        console.log(
          "Skipping event: missing sender/text or message is an echo."
        );
        continue;
      }

      console.log("Processing incoming Instagram text message.");

      try {
        const appBaseUrl = (
          process.env.APP_BASE_URL || "http://localhost:3000"
        ).replace(/\/+$/, "");

        // Ask the existing AI assistant for a catalog-based reply.
        const aiResponse = await fetch(
          `${appBaseUrl}/api/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: text }),
            cache: "no-store",
          }
        );

        const aiBody = await aiResponse.text();

        let aiData: any = null;

        try {
          aiData = JSON.parse(aiBody);
        } catch {
          console.error("AI endpoint returned invalid JSON.");
        }

        if (!aiResponse.ok) {
          console.error("AI endpoint failed:", {
            status: aiResponse.status,
            error: aiData?.error || aiBody.slice(0, 500),
          });
          continue;
        }

        const reply = aiData?.reply;

        if (typeof reply !== "string" || !reply.trim()) {
          console.error("AI endpoint returned no reply.");
          continue;
        }

        // Send the reply using the Instagram Login API.
        const instagramResponse = await fetch(
          "https://graph.instagram.com/v26.0/me/messages",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: {
                text: reply.trim().slice(0, 1000),
              },
            }),
            cache: "no-store",
          }
        );

        const instagramBody = await instagramResponse.text();

        let instagramData: any = null;

        try {
          instagramData = JSON.parse(instagramBody);
        } catch {
          console.error(
            "Instagram API returned a non-JSON response."
          );
        }

        if (!instagramResponse.ok) {
          console.error("Instagram send failed:", {
            status: instagramResponse.status,
            error: instagramData || instagramBody.slice(0, 500),
          });
          continue;
        }

        console.log("Instagram reply sent successfully.");
      } catch (error) {
        console.error(
          "Instagram message processing failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Could not process Instagram webhook:",
      error instanceof Error ? error.message : "Invalid payload"
    );

    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 }
    );
  }
}
