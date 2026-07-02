"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  type BuyerGeo,
  clearCachedGeo,
  clearGeoPromptDismissed,
  fetchIpGeo,
  getBrowserPosition,
  readCachedGeo,
  readGeoPromptDismissed,
  writeCachedGeo,
  writeGeoPromptDismissed,
} from "@/lib/search/geo";

type GeoContextValue = {
  geo: BuyerGeo | null;
  promptVisible: boolean;
  requesting: boolean;
  requestPrecise: () => void;
  keepApproximate: () => void;
  reset: () => void;
};

const GeoContext = createContext<GeoContextValue | null>(null);

export function useBuyerGeo(): GeoContextValue {
  const ctx = useContext(GeoContext);
  if (!ctx) {
    throw new Error("useBuyerGeo must be used within a GeoProvider");
  }
  return ctx;
}

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [geo, setGeo] = useState<BuyerGeo | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrapGeo() {
      const cached = readCachedGeo();
      if (cached) {
        if (active) {
          setGeo(cached);
        }
        return;
      }

      if (readGeoPromptDismissed()) {
        return;
      }

      const ip = await fetchIpGeo();
      if (!active) {
        return;
      }

      if (ip && ip.lat !== null && ip.lng !== null) {
        setGeo({
          lat: ip.lat,
          lng: ip.lng,
          city: ip.city,
          region: ip.region,
          source: "ip",
        });
      }
      setPromptVisible(true);
    }

    void bootstrapGeo();

    return () => {
      active = false;
    };
  }, []);

  const requestPrecise = useCallback(() => {
    setRequesting(true);
    getBrowserPosition()
      .then((pos) => {
        const next: BuyerGeo = {
          lat: pos.lat,
          lng: pos.lng,
          city: geo?.city ?? null,
          region: geo?.region ?? null,
          source: "browser",
        };
        setGeo(next);
        writeCachedGeo(next);
        writeGeoPromptDismissed();
        setPromptVisible(false);
      })
      .catch(() => {
        // Denied or failed: keep the approximate (IP) location if we have one.
        if (geo) writeCachedGeo(geo);
        writeGeoPromptDismissed();
        setPromptVisible(false);
      })
      .finally(() => setRequesting(false));
  }, [geo]);

  const keepApproximate = useCallback(() => {
    if (geo) writeCachedGeo(geo);
    writeGeoPromptDismissed();
    setPromptVisible(false);
  }, [geo]);

  const reset = useCallback(() => {
    clearCachedGeo();
    clearGeoPromptDismissed();
    setGeo(null);
    setPromptVisible(true);
  }, []);

  return (
    <GeoContext.Provider
      value={{
        geo,
        promptVisible,
        requesting,
        requestPrecise,
        keepApproximate,
        reset,
      }}
    >
      {children}
    </GeoContext.Provider>
  );
}
