import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { Splash } from '@/components/splash';
import { useAuth } from '@/context/AuthContext';

// The welcome screen only shows once per app launch, not after every sign-in
let splashShown = false;

/**
 * The app's front door ("/"). It shows the MyDocs RSA welcome screen, then sends each person
 * to the right place: signed out -> sign-in, then user / officer / admin each to their own home.
 */
export default function Index() {
  const { user } = useAuth();
  const [ready, setReady] = useState(splashShown);

  useEffect(() => {
    if (splashShown) return;
    const timer = setTimeout(() => {
      splashShown = true;
      setReady(true);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <Splash />;
  if (!user) return <Redirect href="/login" />;

  switch (user.role) {
    case 'ADMIN':
      return <Redirect href="/overview" />;
    case 'POLICE_OFFICER':
      return <Redirect href="/queue" />;
    default:
      return <Redirect href="/wallet" />;
  }
}
