"use client";

import dynamic from "next/dynamic";

export const HotelsMap = dynamic(() => import("./HotelsMap").then((mod) => mod.HotelsMap), {
  ssr: false,
});
