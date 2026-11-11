import { Banner, Button } from '@/components/ui-kit';
import { useAuth } from '@/context/AuthContext';

type State = {
  error: string;
  sessionExpired: boolean;
  refresh: () => unknown;
};

/**
 * Error panel for screens that load data. Offers "Try again", or "Sign in again" when the
 * problem is an expired login (so you can never get stuck on a screen that cannot load).
 */
export function LoadError({ state, fallback }: { state: State; fallback?: string }) {
  const { logout } = useAuth();

  return (
    <>
      <Banner message={state.error || fallback || 'Something went wrong. Try again.'} />
      {state.sessionExpired ? (
        <Button title="Sign in again" onPress={logout} />
      ) : (
        <Button title="Try again" variant="secondary" onPress={state.refresh} />
      )}
    </>
  );
}
