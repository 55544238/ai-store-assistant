
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    const { data: conversations, error: conversationsError } =
      await supabase
        .from("chat_conversations")
        .select("id, title, created_at, updated_at")
        .eq("store_id", STORE_ID)
        .order("updated_at", { ascending: false })
        .limit(50);

    if (conversationsError) {
      console.error("Conversation history error:", conversationsError);
      return NextResponse.json(
        { error: "Could not load conversations." },
        { status: 500 }
      );
    }

    if (!conversationId) {
      return NextResponse.json({
        conversations: conversations ?? [],
        messages: [],
      });
    }

    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        conversationId
      );

    if (!isValidUuid) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    const { data: conversation, error: conversationError } =
      await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("store_id", STORE_ID)
        .maybeSingle();

    if (conversationError) {
      console.error("Conversation check error:", conversationError);
      return NextResponse.json(
        { error: "Could not verify conversation." },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("store_id", STORE_ID)
      .order("created_at", { ascending: true })
      .limit(200);

    if (messagesError) {
      console.error("Message history error:", messagesError);
      return NextResponse.json(
        { error: "Could not load messages." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversations: conversations ?? [],
      messages: messages ?? [],
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
