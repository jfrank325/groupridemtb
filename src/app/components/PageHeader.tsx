import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  titleHighlight?: string;
  description?: string;
  prefix?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  titleHighlight,
  description,
  prefix,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <section className={`bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center">
          {prefix && <div className="mb-4">{prefix}</div>}
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 ${prefix ? "mb-2" : "mb-4"}`}>
            {title}
            {titleHighlight && (
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                {titleHighlight}
              </span>
            )}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

