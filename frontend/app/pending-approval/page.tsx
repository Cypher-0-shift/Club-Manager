export default function PendingApprovalPage() {
  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Pending Approval</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Your account has been created and is waiting for approval from a club officer.<br />
          You will be able to sign in once approved.
        </p>
        <a
          href="/login"
          className="btn btn-secondary btn-full"
          style={{ marginTop: '24px', display: 'block' }}
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}
