'use client';

import Link from "next/link";
import { userSchema, UserFormData } from '@/lib/validation/userSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createUser } from '../actions/createUser';
import { useRouter } from "next/navigation";
import { useState } from 'react';

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      zip: ''
    },
  });

  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const password = watch('password');

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const strengthMap = {
      0: { text: '', color: '' },
      1: { text: 'Very Weak', color: 'text-red-500' },
      2: { text: 'Weak', color: 'text-orange-500' },
      3: { text: 'Fair', color: 'text-yellow-500' },
      4: { text: 'Good', color: 'text-blue-500' },
      5: { text: 'Strong', color: 'text-green-500' },
    };
    
    return strengthMap[strength as keyof typeof strengthMap] || strengthMap[0];
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: UserFormData) => {
    setSubmitError(null);
    
    try {
      // Send plain password - will be hashed server-side (security best practice)
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('password', data.password);
      formData.append('email', data.email.toLowerCase().trim());
      if (data.zip && data.zip.length === 5) {
        formData.append('zip', data.zip.trim());
      }
      
      const result = await createUser(formData);
      
      if (result?.error) {
        // Handle field-specific errors
        if ('_form' in result.error && result.error._form) {
          setSubmitError(result.error._form[0]);
        } else if ('email' in result.error && result.error.email) {
          setSubmitError(result.error.email[0]);
        } else if ('name' in result.error && result.error.name) {
          setSubmitError(result.error.name[0]);
        } else if ('password' in result.error && result.error.password) {
          setSubmitError(result.error.password[0]);
        } else if ('zip' in result.error && result.error.zip) {
          setSubmitError(result.error.zip[0]);
        } else {
          setSubmitError('Failed to create account. Please check your information and try again.');
        }
        return;
      }
      
      // Success - redirect to login
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          autoComplete="name"
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
          placeholder="Enter your full name"
          {...register('name')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
        {errors.name && (
          <p id="name-error" className="text-red-500 text-sm mt-2" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="your.email@example.com"
          {...register('email')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
        {errors.email && (
          <p id="email-error" className="text-red-500 text-sm mt-2" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : undefined}
          placeholder="Create a strong password"
          {...register('password')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
        {password && passwordStrength.text && (
          <p className={`text-sm mt-2 ${passwordStrength.color}`} role="status" aria-live="polite">
            Password strength: {passwordStrength.text}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Must be at least 8 characters with uppercase, lowercase, number, and special character
        </p>
        {errors.password && (
          <p id="password-error" className="text-red-500 text-sm mt-2" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Zip Code */}
      <div>
        <label htmlFor="zip" className="block text-sm font-semibold text-gray-900 mb-2">
          Zip Code <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          id="zip"
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={5}
          pattern="[0-9]{5}"
          aria-invalid={errors.zip ? "true" : "false"}
          aria-describedby={errors.zip ? "zip-error" : undefined}
          placeholder="12345"
          {...register('zip')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
        {errors.zip && (
          <p id="zip-error" className="text-red-500 text-sm mt-2" role="alert">
            {errors.zip.message}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <p className="text-red-600 text-sm">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </>
          )}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          By creating an account you agree to our{' '}
          <Link
            href="/terms"
            className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Terms of Use
          </Link>
          {' '}and acknowledge our{' '}
          <Link
            href="/privacy"
            className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
