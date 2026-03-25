import { ReactNode } from 'react';

export const dynamicParams = true; // Allow any [id] value

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array - routes will be generated on-demand during build
  // This satisfies Next.js static export requirement
  return [];
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
