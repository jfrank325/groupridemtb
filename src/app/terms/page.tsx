import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Understand the terms and conditions for using MTB Group Ride.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-gray-100">Terms of Use</h1>
      <p className="mt-4 text-sm text-gray-100">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-gray-100">
        <p>
          By creating an account or accessing MTB Group Ride, you agree to use the service in accordance
          with these terms. You are responsible for the accuracy of the information you provide and for
          keeping your account credentials secure.
        </p>
        <p>
          MTB Group Ride is provided on an “as-is” basis without warranties of any kind. We are not liable
          for injuries, damages, or losses that arise from participating in rides, using trail information,
          or interacting with other members.
        </p>
        <p>
          You authorize us to send service-related communications, including ride announcements,
          cancellation notices, and new message alerts. These emails are sent through our provider
          Mailgun solely for MTB Group Ride functionality. You may manage certain notification preferences
          from your profile; however, transactional updates (for example, critical account notices) will
          continue while your account remains active.
        </p>
        <p>
          You may not use the platform to distribute spam, infringe on intellectual property rights, or
          engage in abusive, harassing, or illegal activity. Violations may result in account suspension or
          termination at our discretion.
        </p>
        <p>
          We reserve the right to update these terms. Continued use of the service after changes go into
          effect signifies acceptance of the updated terms. If you have questions, contact us at
          {' '}<a href="mailto:support@mtbgroupride.com" className="text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline">
            support@mtbgroupride.com
          </a>.
        </p>
      </div>
    </section>
  );
}

