"use client";

import { useCallback, useState } from "react";

import { PlanLimitNotice } from "@/components/billing/plan-limit-notice";
import { PieceEditor } from "@/components/smartfinder/piece-editor";
import { ResultsList } from "@/components/smartfinder/results-list";
import { UploadStep } from "@/components/smartfinder/upload-step";
import { findMatchingSlabs } from "@/app/account/smartfinder/actions";
import type { Piece, SmartFinderResult } from "@/lib/smartfinder/types";

type Step = "upload" | "pieces" | "results";

const STEP_META: Record<Step, { number: number; label: string }> = {
  upload: { number: 1, label: "Upload plan" },
  pieces: { number: 2, label: "Define pieces" },
  results: { number: 3, label: "View results" },
};

const STEPS: Step[] = ["upload", "pieces", "results"];

export function SmartfinderFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [results, setResults] = useState<SmartFinderResult[]>([]);
  const [ownResults, setOwnResults] = useState<SmartFinderResult[]>([]);
  const [marketResults, setMarketResults] = useState<SmartFinderResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [limited, setLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [upgradeTo, setUpgradeTo] = useState<"pro" | "premium" | null>(null);

  const handleImageSelected = useCallback((url: string | null) => {
    setImageUrl(url);
    setAutoFilled(false);
    setStep("pieces");
  }, []);

  const handlePiecesExtracted = useCallback(
    (extracted: Piece[], url: string | null) => {
      setPieces(extracted);
      setImageUrl(url);
      setAutoFilled(true);
      setStep("pieces");
    },
    [],
  );

  const handleSkipUpload = useCallback(() => {
    setAutoFilled(false);
    setStep("pieces");
  }, []);

  const handleSearch = useCallback(async (selectedPieces: Piece[]) => {
    setPieces(selectedPieces);
    setLoading(true);
    setSearchError(null);
    setUpgradeTo(null);
    setStep("results");

    try {
      const data = await findMatchingSlabs(selectedPieces);
      if (data.error) {
        setSearchError(data.error);
        setUpgradeTo(data.upgradeTo ?? null);
        setResults([]);
        setOwnResults([]);
        setMarketResults([]);
        setTotalMatches(0);
        setLimited(false);
        setStep("pieces");
        return;
      }
      setResults(data.results);
      setOwnResults(data.ownResults);
      setMarketResults(data.marketResults);
      setTotalMatches(data.totalMatches);
      setLimited(data.limited);
    } catch {
      setResults([]);
      setOwnResults([]);
      setMarketResults([]);
      setTotalMatches(0);
      setLimited(false);
      setSearchError("Could not run SmartFinder search.");
      setStep("pieces");
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
    setOwnResults([]);
    setMarketResults([]);
    setTotalMatches(0);
    setLimited(false);
    setSearchError(null);
    setUpgradeTo(null);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="SmartFinder steps"
        className="flex items-center justify-center gap-2"
      >
        {STEPS.map((s, i) => {
          const meta = STEP_META[s];
          const isCurrent = s === step;
          const isPast = STEPS.indexOf(step) > i;

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 sm:w-12 ${
                    isPast ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"
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
                    ? "bg-brand text-white shadow-md shadow-brand/25"
                    : isPast
                      ? "bg-brand/15 text-brand-strong hover:bg-brand/25"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : isPast
                        ? "bg-brand/20 text-brand-strong"
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

      {step === "upload" && (
        <UploadStep
          imageUrl={imageUrl}
          onImageSelected={handleImageSelected}
          onPiecesExtracted={handlePiecesExtracted}
          onSkip={handleSkipUpload}
        />
      )}

      {step === "pieces" && (
        <>
          {searchError ? (
            <PlanLimitNotice
              message={searchError}
              upgradeTo={upgradeTo ?? undefined}
            />
          ) : null}
          <PieceEditor
            initialPieces={pieces}
            imageUrl={imageUrl}
            autoFilled={autoFilled}
            onSearch={handleSearch}
            onBack={() => setStep("upload")}
          />
        </>
      )}

      {step === "results" && (
        <ResultsList
          results={results}
          ownResults={ownResults}
          marketResults={marketResults}
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
