import { useMemo, useState } from "react";

type GuideSection = {
  id: string;
  title: string;
  body: JSX.Element;
};

type StudioGuidePanelProps = {
  isVisible: boolean;
  onClose: () => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (next: boolean) => void;
};

type CollapsibleSectionProps = {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: JSX.Element;
};

function CollapsibleSection({ id, title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  const contentId = `${id}-content`;
  const headerId = `${id}-header`;

  return (
    <section className="guide-section">
      <h3 className="guide-section-title" id={headerId}>
        <button
          type="button"
          className="guide-toggle"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
        >
          <span>{title}</span>
          <span aria-hidden>{isOpen ? "−" : "+"}</span>
        </button>
      </h3>
      <div id={contentId} role="region" aria-labelledby={headerId} hidden={!isOpen} className="guide-section-content">
        {children}
      </div>
    </section>
  );
}

const JSONL_EXAMPLE = `{"doc_id":"d1","text":"I first listed assumptions, then checked edge cases.","meta.source":"pilot_batch_1"}\n{"doc_id":"d2","text":"I changed my answer after testing a small example.","meta.source":"pilot_batch_1"}`;

const CSV_EXAMPLE = `doc_id,text,meta.source\nd1,"I first listed assumptions, then checked edge cases.",pilot_batch_1\nd2,"I changed my answer after testing a small example.",pilot_batch_1`;

export function StudioGuidePanel({ isVisible, onClose, dontShowAgain, onDontShowAgainChange }: StudioGuidePanelProps) {
  const sections = useMemo<GuideSection[]>(
    () => [
      {
        id: "what-is-thoughttagger",
        title: "1) What is ThoughtTagger?",
        body: (
          <>
            <p>
              ThoughtTagger is a <strong>spec-driven annotation system</strong> for think-aloud / chain-of-thought data.
              Studio creates a Study Spec, and annotator interfaces are rendered from that spec.
            </p>
            <ul>
              <li>Design by choosing constrained primitives, not writing custom UI code.</li>
              <li>Researchers upload full documents; unitization is derived by the platform.</li>
              <li>The same spec can be recompiled and audited over time.</li>
            </ul>
          </>
        )
      },
      {
        id: "prepare-dataset",
        title: "2) Prepare your dataset",
        body: (
          <>
            <p>
              Accepted formats: <code>.jsonl</code> and <code>.csv</code>. Required fields: <code>doc_id</code> (unique)
              and <code>text</code> (full think-aloud response).
            </p>
            <p>
              Recommended metadata pattern: use namespaced columns such as <code>meta.source</code>,
              <code>meta.model</code>, and <code>meta.topic</code>.
            </p>
            <ul>
              <li>Common mistake: uploading pre-split sentences instead of full responses.</li>
              <li>Common mistake: missing IDs or blank <code>doc_id</code> values.</li>
              <li>Common mistake: duplicate IDs across rows.</li>
              <li>Common mistake: empty <code>text</code> fields after copy/paste.</li>
              <li>Common mistake: metadata-only rows with no annotatable content.</li>
            </ul>
            <div className="guide-example-grid">
              <div>
                <h4>Minimal JSONL example</h4>
                <pre>
                  <code>{JSONL_EXAMPLE}</code>
                </pre>
              </div>
              <div>
                <h4>Minimal CSV example</h4>
                <pre>
                  <code>{CSV_EXAMPLE}</code>
                </pre>
              </div>
            </div>
          </>
        )
      },
      {
        id: "task-and-unitization",
        title: "3) Choose task + unitization",
        body: (
          <>
            <p>
              Task and unitization define annotation behavior. Choose intentionally based on your research question.
            </p>
            <ul>
              <li>
                <strong>Task type:</strong> <code>label</code>, <code>annotate</code>, or <code>compare</code>
              </li>
              <li>
                <strong>Unitization:</strong> <code>document</code>, <code>sentence/step</code>, or <code>target_span</code>
              </li>
              <li>
                <strong>Run mode:</strong> <code>participant</code> (fixed) vs <code>RA</code> (resumable policy)
              </li>
            </ul>
            <p>
              For CoT reliability, keep source text as full documents and let sentence/step segmentation be derived.
            </p>
          </>
        )
      },
      {
        id: "replication-workplan",
        title: "4) Replication & work plan",
        body: (
          <>
            <p>
              Replication controls rating reliability: each document is assigned to <code>k</code> distinct raters, and each
              assigned rater labels <strong>all units</strong> in that document.
            </p>
            <ul>
              <li>Higher <code>k</code> improves robustness but increases total judgments.</li>
              <li>Use workload cards to estimate total sentence judgments and per-rater load.</li>
              <li>Check label granularity before scaling to avoid expensive relabel cycles.</li>
            </ul>
          </>
        )
      },
      {
        id: "faq",
        title: "FAQ / Common pitfalls",
        body: (
          <ul>
            <li>
              <strong>Should I encode labels in the dataset?</strong> No. Define labels in the Label System Designer so the
              spec is versioned and auditable.
            </li>
            <li>
              <strong>Can I hide this guide?</strong> Yes. Use “Don’t show again” — you can always re-open it from the Guide
              button in the header.
            </li>
            <li>
              <strong>Is this guide exported?</strong> No. It is global onboarding UI only and is never included in Study Spec
              artifacts.
            </li>
          </ul>
        )
      }
    ],
    []
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((section) => [section.id, true]))
  );

  if (!isVisible) return null;

  const allExpanded = sections.every((section) => openSections[section.id]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    setOpenSections(Object.fromEntries(sections.map((section) => [section.id, nextState])));
  };

  return (
    <section className="card studio-guide" aria-label="Studio guide panel">
      <div className="guide-header">
        <div>
          <h2>Before You Start — Studio Guide & Requirements</h2>
          <p className="muted">
            Global onboarding for Studio usage. This reference explains dataset prep, annotation primitives, and work-plan
            logic. It is not study-specific content.
          </p>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={toggleAll}>
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
          <button type="button" onClick={onClose}>
            Hide guide
          </button>
        </div>
      </div>

      <label className="guide-toggle-row">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(event) => onDontShowAgainChange(event.target.checked)}
        />
        Don&apos;t show again (you can always reopen from the Guide button)
      </label>

      <div className="guide-body-scroll">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.id}
            id={section.id}
            title={section.title}
            isOpen={Boolean(openSections[section.id])}
            onToggle={() => setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
          >
            {section.body}
          </CollapsibleSection>
        ))}
      </div>
    </section>
  );
}
