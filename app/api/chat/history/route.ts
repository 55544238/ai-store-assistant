
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Verify the signed-in user.
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "You must sign in to view chat history." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // Find the store belonging to this user.
    const { data: membership, error: membershipError } = await supabase
      .from("store_members")
      .select("store_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Store membership error:", membershipError);
      return NextResponse.json(
        { error: "Could not verify your store." },
        { status: 500 }
      );
    }

    if (!membership?.store_id) {
      return NextResponse.json(
        { error: "No store is connected to your account." },
        { status: 404 }
      );
    }

    const storeId = membership.store_id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    // Load this user's store conversations.
    const { data: conversations, error: conversationsError } =
      await supabase
        .from("chat_conversations")
        .select("id, title, created_at, updated_at")
        .eq("store_id", storeId)
        .order("updated_at", { ascending: false })
        .limit(50);

    if (conversationsError) {
      console.error("Conversation history error:", conversationsError);
      return NextResponse.json(
        { error: "Could not load conversations." },
        { status: 500 }
      );
    }

    // No conversation selected: return the conversation list.
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

    // Confirm that the selected conversation belongs to this user's store.
    const { data: conversation, error: conversationError } =
      await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("store_id", storeId)
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
      .eq("store_id", storeId)
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
