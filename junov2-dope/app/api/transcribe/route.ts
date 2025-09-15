import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const language = formData.get("language") as string | null;
        const prompt = formData.get("prompt") as string | null;

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Missing 'file'" }, { status: 400 });
        }

        const transcription = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file,
            language: language ?? undefined,
            prompt: prompt ?? undefined,
        });

        return NextResponse.json({ text: transcription.text || "" });
    } catch (error) {
        console.error("/api/transcribe error:", error);
        return NextResponse.json({ error: "Failed to transcribe" }, { status: 500 });
    }
}


