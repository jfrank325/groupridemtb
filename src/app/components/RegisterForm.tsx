'use client';

import { userSchema, UserFormData } from '@/lib/validation/userSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createUser } from '../actions/createUser';
import bcrypt from 'bcryptjs';
import { useRouter } from "next/navigation";

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

    const onSubmit = async (data: UserFormData) => {
        console.log('Submitted:', data);
        const password = await bcrypt.hash(data.passwordHash, 10);
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('passwordHash', String(password));
        formData.append('email', data.email);
        formData.append('zip', String(data.zip));
        try {
            await createUser(formData);
            router.push('/profile');
        } catch (error) {
            console.error('Error creating user:', error);
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
            <textarea
                id="password"
                {...register('passwordHash')}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {errors.passwordHash && (
                <p className="text-red-500 text-sm">{errors.passwordHash.message}</p>
            )}
        </div>
        <div>
            <label htmlFor="zip" className="block font-medium">Zipcode</label>
            <textarea
                id="zip"
                {...register('zip')}
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
            {errors.zip && (
                <p className="text-red-500 text-sm">{errors.zip.message}</p>
            )}
        </div>

        <button
            type="submit"
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium"
        >
            Submit
        </button>
    </form>;
}