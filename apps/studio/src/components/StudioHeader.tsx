type StudioHeaderProps = {
  onOpenGuide: () => void;
  guideHiddenByDefault: boolean;
};

export function StudioHeader({ onOpenGuide, guideHiddenByDefault }: StudioHeaderProps) {
  return (
    <header className="card hero studio-header">
      <div>
        <h1>ThoughtTagger Studio</h1>
        <p className="muted">
          A study composer for constrained CoT annotation primitives. Configure once, preview continuously, export
          spec-driven artifacts.
        </p>
      </div>
      <div className="inline-actions">
        {guideHiddenByDefault ? <span className="badge">Guide hidden by default</span> : null}
        <button className="primary" onClick={onOpenGuide}>
          Guide
        </button>
      </div>
    </header>
  );
}
