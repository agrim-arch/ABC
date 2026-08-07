import { NextResponse } from "next/server";
import type { InterviewResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, candidate, message } = body || {};

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid sessionId" },
        { status: 400 }
      );
    }

    // 1. Initial request (Candidate initialization)
    if (candidate) {
      const response: InterviewResponse = {
        reply: "Welcome. Let's begin your interview.",
        done: false,
      };
      return NextResponse.json(response);
    }

    // 2. Conversation Turn
    if (typeof message === "string") {
      const response: InterviewResponse = {
        reply: "Thank you for your response. Let's continue.",
        done: false,
      };
      return NextResponse.json(response);
    }

    // Default fallback skeleton response
    const defaultResponse: InterviewResponse = {
      reply: "Interview session active.",
      done: false,
    };
    return NextResponse.json(defaultResponse);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
