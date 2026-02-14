"use client";

import { useEffect, useState } from "react";

export default function TestMap() {
  const [tokenStatus, setTokenStatus] = useState("Checking...");
  const [networkStatus, setNetworkStatus] = useState("Checking...");
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    // Check token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (token) {
      setTokenStatus(`✅ Token found: ${token.substring(0, 20)}...`);
    } else {
      setTokenStatus("❌ Token missing");
      return;
    }

    // Test network connectivity to Mapbox
    const testNetwork = async () => {
      try {
        const response = await fetch("https://api.mapbox.com/", { method: "HEAD", mode: "no-cors" });
        setNetworkStatus("✅ Can reach api.mapbox.com");
      } catch (error) {
        setNetworkStatus(`❌ Cannot reach api.mapbox.com: ${error}`);
      }
    };

    // Test token validity with Mapbox API
    const testToken = async () => {
      try {
        const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${token}`;
        const response = await fetch(url);

        if (response.ok) {
          setApiStatus("✅ Token is valid and authorized");
        } else {
          const error = await response.text();
          setApiStatus(`❌ Token invalid or unauthorized: ${response.status} ${error}`);
        }
      } catch (error) {
        setApiStatus(`❌ API test failed: ${error}`);
      }
    };

    testNetwork();
    testToken();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Mapbox Diagnostics</h1>

      <div className="space-y-4">
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Token Status</h2>
          <pre className="text-sm whitespace-pre-wrap">{tokenStatus}</pre>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Network Connectivity</h2>
          <pre className="text-sm whitespace-pre-wrap">{networkStatus}</pre>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Token Validation</h2>
          <pre className="text-sm whitespace-pre-wrap">{apiStatus}</pre>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ul className="text-sm text-white/70 space-y-2 list-disc list-inside">
            <li>If token is missing, check .env.local file</li>
            <li>If network is unreachable, check firewall/proxy settings</li>
            <li>If token is invalid, verify it at <a href="https://account.mapbox.com/access-tokens/" className="text-blue-400 underline">Mapbox account</a></li>
            <li>If all pass but map still doesn't show, check browser console for tile loading errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
