'use client';

export default function BasicButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
            {children}
        </button>
    );
}