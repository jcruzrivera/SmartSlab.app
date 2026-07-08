"use client";

import { useCallback, useState } from "react";

import { PieceEditor } from "@/components/smartfinder/piece-editor";
import { ResultsList } from "@/components/smartfinder/results-list";
import { UploadStep } from "@/components/smartfinder/upload-step";
import type { SmartFinderResult } from "@/app/account/smartfinder/actions";
import { findMatchingSlabs } from "@/app/account/smartfinder/actions";
import type { Piece } from "@/lib/smartfinder/types";

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

type Step = "upload" | "pieces" | "results";

const STEP_META: Record<Step, { number: number; label: string }> = {
  upload: { number: 1, label: "Upload photo" },
  pieces: { number: 2, label: "Define pieces" },
  results: { number: 3, label: "View results" },
};

const STEPS: Step[] = ["upload", "pieces", "results"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SmartfinderFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [results, setResults] = useState<SmartFinderResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [limited, setLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageSelected = useCallback((url: string | null) => {
    setImageUrl(url);
    setStep("pieces");
  }, []);

  const handleSkipUpload = useCallback(() => {
    setStep("pieces");
  }, []);

  const handleSearch = useCallback(async (selectedPieces: Piece[]) => {
    setPieces(selectedPieces);
    setLoading(true);
    setStep("results");

    try {
      const data = await findMatchingSlabs(selectedPieces);
      setResults(data.results);
      setTotalMatches(data.totalMatches);
      setLimited(data.limited);
    } catch {
      setResults([]);
      setTotalMatches(0);
      setLimited(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackToPieces = useCallback(() => {
    setStep("pieces");
  }, []);

  const handleStartOver = useCallback(() => {
    setStep("upload");
    setImageUrl(null);
    setPieces([]);
    setResults([]);
    setTotalMatches(0);
    setLimited(false);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Stepper ------------------------------------------------ */}
      <nav aria-label="SmartFinder steps" className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const meta = STEP_META[s];
          const isCurrent = s === step;
          const isPast = STEPS.indexOf(step) > i;

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 sm:w-12 ${
                    isPast ? "bg-[#1bb0ce]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (isPast) setStep(s);
                }}
                disabled={!isPast}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  isCurrent
                    ? "bg-[#1bb0ce] text-white shadow-md shadow-[#1bb0ce]/25"
                    : isPast
                      ? "bg-[#1bb0ce]/15 text-[#0d8fa8] hover:bg-[#1bb0ce]/25"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : isPast
                        ? "bg-[#1bb0ce]/20 text-[#0d8fa8]"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                  }`}
                >
                  {isPast ? "✓" : meta.number}
                </span>
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* ---- Step content ------------------------------------------- */}
      {step === "upload" && (
        <UploadStep
          imageUrl={imageUrl}
          onImageSelected={handleImageSelected}
          onSkip={handleSkipUpload}
        />
      )}

      {step === "pieces" && (
        <PieceEditor
          initialPieces={pieces}
          imageUrl={imageUrl}
          onSearch={handleSearch}
          onBack={() => setStep("upload")}
        />
      )}

      {step === "results" && (
        <ResultsList
          results={results}
          totalMatches={totalMatches}
          limited={limited}
          loading={loading}
          pieces={pieces}
          onBack={handleBackToPieces}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
