'use client';

import { userSchema, UserFormData } from '@/lib/validation/userSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createUser } from '../actions/createUser';
import bcrypt from 'bcryptjs';
import { useRouter } from "next/navigation";
import { useState } from 'react';

export default function RegisterForm() {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        watch,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            passwordHash: '',
            zip: ''
        },
    });

    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const password = watch('passwordHash');

    // Password strength indicator
    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { strength: 0, text: '' };
        
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
        console.log('Submitted:', data);
        
        try {
            // Hash password on client side (in production, consider doing this server-side)
            const hashedPassword = await bcrypt.hash(data.passwordHash, 10);
            const formData = new FormData();
            formData.append('name', data.name.trim());
            formData.append('passwordHash', hashedPassword);
            formData.append('email', data.email.toLowerCase().trim());
            if (data.zip) {
                formData.append('zip', String(data.zip).trim());
            }
            
            const result = await createUser(formData);
            
            if (result?.error) {
                setSubmitError('Failed to create account. Please try again.');
                return;
            }
            
            router.push('/login');
        } catch (error) {
            console.error('Error creating user:', error);
            setSubmitError('An error occurred. Please try again.');
        }
    };

    return <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
        <div>
            <label htmlFor="name" className="block font-medium">User Name</label>
            <input
                type="name"
                id="name"
                {...register('name')}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
            <label htmlFor="email" className="block font-medium">Email</label>
            <input
                type="text"
                id="email"
                {...register('email')}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
        </div>

        <div>
            <label htmlFor="password" className="block font-medium">Password</label>
            <input
                type="password"
                id="password"
                {...register('passwordHash')}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {password && passwordStrength.text && (
                <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.text}
                </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
            {errors.passwordHash && (
                <p className="text-red-500 text-sm mt-1">{errors.passwordHash.message}</p>
            )}
        </div>
        <div>
            <label htmlFor="zip" className="block font-medium">Zipcode (Optional)</label>
            <input
                type="text"
                id="zip"
                {...register('zip')}
                maxLength={5}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {errors.zip && (
                <p className="text-red-500 text-sm mt-1">{errors.zip.message}</p>
            )}
        </div>
        {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{submitError}</p>
            </div>
        )}

        <button
            type="submit"
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium"
        >
            Submit
        </button>
    </form>;
}