import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how MTB Group Ride collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-gray-100">Privacy Policy</h1>
      <p className="mt-4 text-sm text-gray-100">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-gray-100">
        <p>
          MTB Group Ride collects only the information required to manage your account and deliver core
          product features. This includes your name, email address, password (stored securely using
          industry-standard hashing), and optional ZIP code to surface relevant rides and trails.
        </p>
        <p>
          We never sell or share your personal information. Access to user data is limited to authorized
          team members who need it to operate the service. We may use aggregated, de-identified data to
          improve features and understand platform usage trends.
        </p>
        <p>
          You can request account deletion or data export at any time by contacting
          {' '}<a href="mailto:support@mtbgroupride.com" className="text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline">
            support@mtbgroupride.com
          </a>.
          We will respond within a reasonable timeframe and confirm when the request is complete.
        </p>
        <p>
          We review this policy regularly and will update it if our data practices change. Material updates
          will be communicated to registered users.
        </p>
      </div>
    </section>
  );
}

