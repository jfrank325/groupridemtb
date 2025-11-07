import RegisterForm from "../components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Join the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                MTB Community
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create your account to connect with local mountain bikers, join group rides, and discover new trails.
            </p>
          </div>
        </div>
      </section>

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
