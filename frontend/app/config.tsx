// BlockQuest Official - Config Redirect
// Redirects to unified Settings page
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ConfigRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to settings page
    router.replace('/settings');
  }, [router]);
  
  return null;
}
