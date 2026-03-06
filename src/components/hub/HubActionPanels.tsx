interface HubActionPanelsProps {
  showJoin: boolean;
  showCreate: boolean;
  inviteCode: string;
  newName: string;
  busy: boolean;
  err: string | null;
  onToggleJoin: () => void;
  onToggleCreate: () => void;
  onInviteCodeChange: (value: string) => void;
  onNewNameChange: (value: string) => void;
  onJoinCampaign: () => void;
  onCreateCampaign: () => void;
}

export default function HubActionPanels({
  showJoin,
  showCreate,
  inviteCode,
  newName,
  busy,
  err,
  onToggleJoin,
  onToggleCreate,
  onInviteCodeChange,
  onNewNameChange,
  onJoinCampaign,
  onCreateCampaign,
}: HubActionPanelsProps) {
  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button className="btn btn--secondary btn--secondary-active" style={{ flex: 1 }} onClick={onToggleJoin}>Rejoindre</button>
        <button className="btn btn--primary" style={{ flex: 1 }} onClick={onToggleCreate}>Nouvelle campagne</button>
      </div>

      {showJoin && (
        <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Rejoindre une campagne</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              placeholder="CODE (6 lettres)"
              value={inviteCode}
              onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase' }}
              autoCapitalize="characters"
              autoCorrect="off"
            />
            <button className="btn btn--primary" onClick={onJoinCampaign} disabled={busy || inviteCode.length < 6}>
              {busy ? '...' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Nouvelle campagne</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              placeholder="Nom de la campagne"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && !busy && newName.trim() && onCreateCampaign()}
            />
            <button className="btn btn--primary" onClick={onCreateCampaign} disabled={busy || !newName.trim()}>
              {busy ? '...' : 'Creer'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Tu seras le Maitre du Jeu.</p>
        </div>
      )}

      {err && (
        <div className="animate-fade-in" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid var(--color-error)', borderRadius: 'var(--button-radius)', color: 'var(--color-error)', fontSize: '0.8125rem' }}>
          {err}
        </div>
      )}
    </>
  );
}
