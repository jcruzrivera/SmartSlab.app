"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type BuyerGeo,
  clearCachedGeo,
  fetchIpGeo,
  getBrowserPosition,
  readCachedGeo,
  writeCachedGeo,
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

  // Keep a ref to the latest geo so callbacks don't need it as a dep.
  // useLayoutEffect syncs after commit (before paint) so it's always current
  // by the time any user interaction can trigger requestPrecise/keepApproximate.
  const geoRef = useRef(geo);
  useLayoutEffect(() => {
    geoRef.current = geo;
  });

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
        const current = geoRef.current;
        const next: BuyerGeo = {
          lat: pos.lat,
          lng: pos.lng,
          city: current?.city ?? null,
          region: current?.region ?? null,
          source: "browser",
        };
        setGeo(next);
        writeCachedGeo(next);
        setPromptVisible(false);
      })
      .catch(() => {
        // Denied or failed: keep the approximate (IP) location if we have one.
        const current = geoRef.current;
        if (current) writeCachedGeo(current);
        setPromptVisible(false);
      })
      .finally(() => setRequesting(false));
  }, []); // geo read via geoRef — stable for the lifetime of the provider

  const keepApproximate = useCallback(() => {
    if (geoRef.current) writeCachedGeo(geoRef.current);
    setPromptVisible(false);
  }, []); // geo read via geoRef — stable for the lifetime of the provider

  const reset = useCallback(() => {
    clearCachedGeo();
    setGeo(null);
    setPromptVisible(true);
  }, []);

  // Memoize the context value so consumers only re-render when geo state
  // actually changes, not on every GeoProvider render.
  const ctxValue = useMemo(
    () => ({ geo, promptVisible, requesting, requestPrecise, keepApproximate, reset }),
    [geo, promptVisible, requesting, requestPrecise, keepApproximate, reset],
  );

  return (
    <GeoContext.Provider value={ctxValue}>
      {children}
    </GeoContext.Provider>
  );
}
