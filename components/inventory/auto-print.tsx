"use client";

import { useEffect } from "react";

/**
 * Opens the browser print dialog once the label sheet has mounted. Vendors land
 * here straight from "Imprimir etiqueta(s)" and expect the dialog to appear.
 */
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
