"use client";

import { useState } from "react";

const REPORT_REASONS = [
  { value: "SEXUAL_CONTENT", label: "Sexual content" },
  { value: "VIOLENCE", label: "Violence or dangerous acts" },
  { value: "HATE_SPEECH", label: "Hate speech or harassment" },
  { value: "SPAM", label: "Spam or misleading" },
  { value: "SCAM", label: "Scam or fraud" },
  { value: "INVOLVES_MINOR", label: "Involves a minor" },
  { value: "COPYRIGHT", label: "Copyright violation" },
  { value: "SELF_HARM", label: "Self-harm" },
  { value: "OTHER", label: "Other" },
] as const;

export default function ReportButton({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/videos/${videoId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setReason("");
        setDetails("");
      }, 2000);
    } catch {
      setError("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="Report video"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </button>

      {/* Report modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-text">
                  Report Video
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted hover:text-text transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-text font-medium">Report submitted</p>
                  <p className="text-sm text-muted mt-1">Thank you for helping keep Scrollr safe.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted mb-4">
                    Why are you reporting this video?
                  </p>

                  <div className="space-y-2 mb-4">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          reason === r.value
                            ? "bg-accent/10 text-accent border border-accent/30"
                            : "bg-card text-text hover:bg-card/80 border border-transparent"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {reason && (
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Additional details (optional)"
                      maxLength={500}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted resize-none h-20 focus:outline-none focus:border-accent/50 mb-4"
                    />
                  )}

                  {error && (
                    <p className="text-sm text-destructive mb-3">{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="w-full py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-destructive/90 transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
