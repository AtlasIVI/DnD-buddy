import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'magic-link';

export default function LoginPage() {
  const { signInWithEmail, signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      if (mode === 'magic-link') {
        const { error: err } = await signInWithEmail(email);
        if (err) setError(err);
        else setMessage('Lien magique envoye ! Verifie ta boite mail.');
      } else if (mode === 'login') {
        const { error: err } = await signInWithPassword(email, password);
        if (err) setError(err);
      } else {
        const { error: err } = await signUp(email, password, displayName);
        if (err) setError(err);
        else setMessage('Compte cree ! Verifie ta boite mail pour confirmer.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const modes: Array<[AuthMode, string]> = [
    ['login', 'Connexion'],
    ['register', 'Inscription'],
    ['magic-link', 'Lien magique'],
  ];

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '24rem', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>DnD Buddy</h1>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Ton compagnon de campagne
        </p>

        <div className="card card--accent">
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
            {modes.map(([m, label]) => (
              <button
                key={m}
                className={mode === m ? 'btn btn--primary' : 'btn btn--ghost'}
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.375rem 0.25rem' }}
                onClick={() => { setMode(m); setError(null); setMessage(null); }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Nom d'aventurier
                </label>
                <input className="input" type="text" placeholder="Gandalf le Gris" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Email</label>
              <input className="input" type="email" placeholder="aventurier@donjon.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== 'magic-link' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Mot de passe</label>
                <input className="input" type="password" placeholder="Min. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            {error && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid var(--color-error)', borderRadius: 'var(--button-radius)', color: 'var(--color-error)', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(39,174,96,0.15)', border: '1px solid var(--color-success)', borderRadius: 'var(--button-radius)', color: 'var(--color-success)', fontSize: '0.8125rem' }}>
                {message}
              </div>
            )}
            <button className="btn btn--primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: '0.5rem' }}>
              {submitting ? 'Chargement...' : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Creer mon compte' : 'Envoyer le lien magique'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
