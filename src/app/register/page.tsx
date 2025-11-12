import RegisterForm from "../components/RegisterForm";
import Link from "next/link";
import { PageHeader } from "../components/PageHeader";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <PageHeader
        title="Join the"
        titleHighlight="MTB Community"
        description="Create your account to connect with local mountain bikers, join group rides, and discover new trails."
      />

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <RegisterForm />
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">
            Already have an account?{" "}
            <Link 
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded cursor-pointer"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
