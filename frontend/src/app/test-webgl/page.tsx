"use client";

import { useEffect, useState } from "react";

export default function TestWebGL() {
  const [webglSupport, setWebglSupport] = useState<string>("Checking...");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "Unknown";
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown";

      setWebglSupport(`✅ WebGL Supported\n\nVendor: ${vendor}\nRenderer: ${renderer}\nVersion: ${gl.getParameter(gl.VERSION)}`);
    } else {
      setWebglSupport("❌ WebGL NOT supported in this browser");
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">WebGL Test</h1>
      <pre className="bg-white/10 p-4 rounded whitespace-pre-wrap">{webglSupport}</pre>
      <div className="mt-4">
        <p className="text-white/50">Mapbox Token: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "✅ Set" : "❌ Not set"}</p>
      </div>
    </div>
  );
}
