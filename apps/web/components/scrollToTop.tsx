"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/lib/i18nNavigation";

export function ScrollToTop() {
  const pathname = usePathname();
  const isPop = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isPop.current) {
      isPop.current = false;
      return;
    }

    if (window.location.hash) {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}