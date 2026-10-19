export default function ConceptChip({ className = '' }) {
  return (
    <a
      href="https://zeltrionsolutions.com"
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-[44px] items-center gap-2 border border-rig px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-mist transition-colors hover:border-steel hover:text-white ${className}`}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-led" style={{ boxShadow: 'var(--led-glow)' }} aria-hidden="true" />
      Concept by Zeltrion
    </a>
  );
}
