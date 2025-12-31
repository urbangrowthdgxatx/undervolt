"use client";

import { Map, AlertCircle, XCircle } from "lucide-react";

export function SimpleMapFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-lg p-8">
      <div className="relative mb-4">
        <Map className="w-16 h-16 text-white/20" />
        <XCircle className="w-8 h-8 text-red-400 absolute -top-1 -right-1" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Map Unavailable</h3>
      <p className="text-white/50 text-center max-w-md mb-4">
        WebGL is not supported in your browser. The interactive map requires WebGL for rendering.
      </p>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-md">
        <div className="flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200/80">
            <p className="font-medium mb-1">Jetson Browser Limitation</p>
            <p>Try accessing this page from a desktop browser with WebGL support, or use the Story Builder mode instead.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
