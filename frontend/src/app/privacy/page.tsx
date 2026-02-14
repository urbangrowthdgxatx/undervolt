import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Undervolt",
  description: "Privacy policy for Undervolt energy infrastructure platform",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-white/70">
              Undervolt ("we", "our", "us") is an energy infrastructure analytics platform.
              This Privacy Policy explains how we collect, use, and protect your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <div className="space-y-4 text-white/70">
              <div>
                <h3 className="font-medium text-white">Email Address</h3>
                <p>When you sign up for custom AI queries or join our waitlist, we collect your email address to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Provide access to custom query features</li>
                  <li>Send product updates (with your consent)</li>
                  <li>Track usage limits per user</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white">Usage Analytics</h3>
                <p>We use Google Analytics to understand how visitors use our platform. This includes:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Pages visited and time spent</li>
                  <li>Device and browser information</li>
                  <li>Geographic region (country/city level)</li>
                  <li>Referral sources</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-white">AI Query Tracking</h3>
                <p>To provide and improve our AI features, we track:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Query content (to improve response quality)</li>
                  <li>Query frequency (to manage rate limits)</li>
                  <li>Browser fingerprint (for anonymous users)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To manage your account and access to features</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate updates about the service</li>
              <li>To detect and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage & Security</h2>
            <p className="text-white/70">
              Your data is stored securely using Supabase (PostgreSQL). AI inference is performed locally
              when possible, with cloud fallback via NVIDIA API Catalog when local models are unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li><strong>Google Analytics:</strong> Web analytics (can be blocked with ad blockers)</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
            <p className="text-white/70">You have the right to:</p>
            <ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
              <li>Request access to your data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Use the service anonymously (with limited features)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-white/70">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:undervolt-team@aisoft.us" className="text-emerald-400 hover:underline">
                undervolt-team@aisoft.us
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
