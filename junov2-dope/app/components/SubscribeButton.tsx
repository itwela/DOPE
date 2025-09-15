"use client";

import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function SubscribeButton() {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [language, setLanguage] = useState<string>("en");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await transcribe(file);
    };

    const transcribe = async (file: File) => {
        setUploading(true);
        setError("");
        setResult("");
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("language", language);
            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: form,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to transcribe");
            setResult(data.text || "");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to transcribe");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="px-3 py-1.5 cursor-pointer text-sm text-white bg-[#EB1416] hover:bg-[#d51314] rounded-lg transition-colors"
                >
                    Subscribe
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Subscribe & Transcribe</DialogTitle>
                    <DialogDescription>
                        Upload a short audio clip and preview AI transcription.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            onChange={onSelectFile}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {uploading ? "Uploading..." : "Upload audio"}
                        </button>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-900">Transcription</div>
                            <div className="text-sm bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-wrap max-h-48 overflow-auto">
                                {result}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


