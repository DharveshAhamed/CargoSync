'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.user_type === 'admin') {
        router.replace('/admin/companies');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="animate-pulse-warm w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
    </div>
  );
}
