import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { UserRole } from '@/types';

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { role } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace('/dashboard');
    }
  }, [role, router, allowedRoles]);

  return role;
}
