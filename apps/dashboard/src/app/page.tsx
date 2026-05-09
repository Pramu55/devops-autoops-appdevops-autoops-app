import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>AutoOps Dashboard</h1>
        <p className={styles.subtitle}>Platform operational visibility</p>
      </header>

      <section className={styles.statusGrid}>
        <StatusCard label="API" endpoint="/health" status="online" />
        <StatusCard label="Worker" endpoint="/health" status="online" />
        <StatusCard label="Kubernetes" endpoint="cluster" status="online" />
      </section>

      <section className={styles.links}>
        <h2>Quick Links</h2>
        <ul>
          <li>
            <a href="/api/health" target="_blank" rel="noreferrer">
              API Health
            </a>
          </li>
          <li>
            <a href="/api/ready" target="_blank" rel="noreferrer">
              API Readiness
            </a>
          </li>
          <li>
            <a href="/api/metrics" target="_blank" rel="noreferrer">
              Prometheus Metrics
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}

interface StatusCardProps {
  label: string;
  endpoint: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
}

function StatusCard({ label, endpoint: _endpoint, status }: StatusCardProps) {
  const statusColor: Record<StatusCardProps['status'], string> = {
    online: 'var(--color-success)',
    degraded: 'var(--color-warning)',
    offline: 'var(--color-error)',
    unknown: 'var(--color-text-muted)',
  };

  return (
    <div className={styles.statusCard}>
      <span
        className={styles.statusDot}
        style={{ backgroundColor: statusColor[status] }}
        aria-hidden="true"
      />
      <span className={styles.statusLabel}>{label}</span>
      <span className={styles.statusValue}>{status}</span>
    </div>
  );
}
