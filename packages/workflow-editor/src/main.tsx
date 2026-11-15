import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createInitialWorkflow, parseWorkflow, PERMISSIONS, serializeWorkflow, STORAGE_KEY, topologicalOrder, type EditorStep, type EditorWorkflow, type StepKind, type WorkflowPermission } from "./model";
import "./styles.css";

type IconName = "home" | "workflow" | "agents" | "tools" | "settings" | "plus" | "play" | "download" | "upload" | "trash" | "up" | "down" | "arrow" | "close" | "fit";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    workflow: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><path d="M9 6h6M18 9v6M6 9v3a3 3 0 0 0 3 3h6"/></>,
    agents: <><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 3v3M8 12h.01M16 12h.01M9 16h6M2 11v4M22 11v4"/></>,
    tools: <><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4l-3 3-3-3z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19v2h16v-2"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 19v2h16v-2"/></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
    up: <><path d="m6 14 6-6 6 6"/></>,
    down: <><path d="m6 10 6 6 6-6"/></>,
    arrow: <><path d="M12 4v16M7 15l5 5 5-5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    fit: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const kinds: Array<{ value: StepKind; label: string }> = [
  { value: "agent", label: "Agent" }, { value: "tool", label: "Tool" },
  { value: "approval", label: "Approval" }, { value: "condition", label: "Condition" },
];
const agents = ["analysis", "planning", "development", "test-runner", "reviewer"];
const agentNames: Record<string, string> = { analysis: "Analysis agent", planning: "Planning agent", development: "Development agent", "test-runner": "Test runner", reviewer: "Independent reviewer" };

function readInitial(): { workflow: EditorWorkflow; saved: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? "";
    if (saved) return { workflow: parseWorkflow(saved), saved };
  } catch { /* Start with the built-in example when local storage is unavailable or invalid. */ }
  return { workflow: createInitialWorkflow(), saved: "" };
}

function nextStepId(steps: EditorStep[]): string {
  let index = steps.length + 1;
  while (steps.some((step) => step.id === `step-${index}`)) index += 1;
  return `step-${index}`;
}

function downloadWorkflow(workflow: EditorWorkflow): void {
  const blob = new Blob([serializeWorkflow(workflow)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${workflow.id}.ases-workflow.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function StepKindMark({ kind }: { kind: StepKind }) {
  return <span aria-label={`${kind} step`} className={`step-kind-mark kind-${kind}`}><span /></span>;
}

function App() {
  const initial = useMemo(readInitial, []);
  const [workflow, setWorkflow] = useState(initial.workflow);
  const [saved, setSaved] = useState(initial.saved);
  const [selectedId, setSelectedId] = useState(initial.workflow.steps[2]?.id ?? initial.workflow.steps[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ order?: string[]; error?: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const importRef = useRef<HTMLInputElement>(null);
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const serialized = useMemo(() => {
    try { return serializeWorkflow(workflow); } catch { return ""; }
  }, [workflow]);
  const dirty = !serialized || serialized !== saved;
  const selected = workflow.steps.find((step) => step.id === selectedId);
  const orderedSteps = workflow.steps;
  const connections = workflow.steps.reduce((total, step) => total + step.dependsOn.length, 0);

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (preview && dialog && !dialog.open) dialog.showModal();
    else if (!preview && dialog?.open) dialog.close();
  }, [preview]);

  function updateWorkflow(update: (current: EditorWorkflow) => EditorWorkflow): void {
    setWorkflow((current) => update(current));
  }

  function updateStep(id: string, update: (step: EditorStep) => EditorStep): void {
    updateWorkflow((current) => ({ ...current, steps: current.steps.map((step) => step.id === id ? update(step) : step) }));
  }

  function addStep(): void {
    const id = nextStepId(workflow.steps);
    const prior = workflow.steps.at(-1)?.id;
    const step: EditorStep = { id, name: "New step", kind: "agent", agentId: "development", dependsOn: prior ? [prior] : [], timeoutMinutes: 15, permissions: ["workspace.read"] };
    updateWorkflow((current) => ({ ...current, steps: [...current.steps, step] }));
    setSelectedId(id);
    setNotice("Step added. Configure its agent and permissions in the properties panel.");
  }

  function removeStep(id: string): void {
    const remaining = workflow.steps.filter((step) => step.id !== id).map((step) => ({ ...step, dependsOn: step.dependsOn.filter((dependency) => dependency !== id) }));
    updateWorkflow((current) => ({ ...current, steps: remaining }));
    setSelectedId(remaining[0]?.id ?? "");
    setNotice("Step removed and its dependency links cleared.");
  }

  function moveStep(id: string, direction: -1 | 1): void {
    updateWorkflow((current) => {
      const index = current.steps.findIndex((step) => step.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.steps.length) return current;
      const steps = [...current.steps];
      [steps[index], steps[target]] = [steps[target]!, steps[index]!];
      return { ...current, steps };
    });
  }

  function saveDraft(): void {
    try {
      const value = serializeWorkflow(workflow);
      localStorage.setItem(STORAGE_KEY, value);
      setSaved(value);
      setNotice("Draft saved in this browser.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this draft."); }
  }

  function previewPlan(): void {
    try { setPreview({ order: topologicalOrder(workflow) }); }
    catch (error) { setPreview({ error: error instanceof Error ? error.message : "Workflow validation failed." }); }
  }

  async function importWorkflow(file?: File): Promise<void> {
    if (!file) return;
    try {
      const imported = parseWorkflow(await file.text());
      setWorkflow(imported);
      setSelectedId(imported.steps[0]?.id ?? "");
      setSaved("");
      setNotice(`Loaded ${file.name}. Save the draft to keep it in this browser.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load this workflow file."); }
    finally { if (importRef.current) importRef.current.value = ""; }
  }

  function setPermission(permission: WorkflowPermission, checked: boolean): void {
    if (!selected) return;
    updateStep(selected.id, (step) => ({ ...step, permissions: checked ? [...step.permissions, permission] : step.permissions.filter((item) => item !== permission) }));
  }

  return <main className="app-shell">
    <aside className="navigation-rail" aria-label="Product navigation">
      <a className="brand" href="#editor" aria-label="Eureka42 ASES workflow editor">
        <img src="/eureka42-logo.svg" alt="Eureka42" />
        <span>ASES</span>
      </a>
      <nav className="primary-navigation">
        <a className="nav-item" href="#editor"><Icon name="home" /><span>Home</span></a>
        <a className="nav-item active" href="#editor" aria-current="page"><Icon name="workflow" /><span>Workflows</span></a>
        <span className="nav-item unavailable" aria-disabled="true" title="Agent catalog view is not part of this editor."><Icon name="agents" /><span>Agents</span></span>
        <span className="nav-item unavailable" aria-disabled="true" title="Tool catalog view is not part of this editor."><Icon name="tools" /><span>Tools</span></span>
        <span className="nav-item unavailable" aria-disabled="true" title="Editor preferences are not configured."><Icon name="settings" /><span>Settings</span></span>
      </nav>
      <div className="rail-footer"><span className="status-dot" />Local workspace</div>
    </aside>

    <section className="editor-column" id="editor">
      <header className="topbar">
        <div className="workflow-heading">
          <div className="breadcrumbs"><a href="#editor">Workflows</a><span aria-hidden="true">/</span><span>{workflow.title || "Untitled workflow"}</span></div>
          <label className="visually-hidden" htmlFor="workflow-title">Workflow name</label>
          <input id="workflow-title" className="workflow-title" maxLength={120} value={workflow.title} onChange={(event) => updateWorkflow((current) => ({ ...current, title: event.target.value }))} />
        </div>
        <div className="top-actions">
          <span className={`save-state ${dirty ? "unsaved" : ""}`} aria-live="polite">{dirty ? "Unsaved changes" : "Saved locally"}</span>
          <button className="button button-secondary" onClick={saveDraft}>Save draft</button>
          <button className="icon-button" aria-label="Export workflow JSON" title="Export workflow JSON" onClick={() => { try { downloadWorkflow(workflow); setNotice("Workflow JSON exported."); } catch (error) { setNotice(error instanceof Error ? error.message : "Export failed."); } }}><Icon name="download" /></button>
          <button className="button button-primary" onClick={previewPlan}><Icon name="play" size={16} /><span>Run preview</span></button>
          <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Choose workflow JSON file" onChange={(event) => void importWorkflow(event.target.files?.[0])} />
          <button className="icon-button import-button" aria-label="Import workflow JSON" title="Import workflow JSON" onClick={() => importRef.current?.click()}><Icon name="upload" /></button>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="steps-panel" aria-label="Workflow steps">
          <div className="panel-heading"><h1>Steps</h1><span>{workflow.steps.length}</span></div>
          <button className="button button-add" onClick={addStep}><Icon name="plus" size={18} /><span>Add step</span></button>
          <ol className="step-list">
            {workflow.steps.map((step, index) => <li key={step.id}>
              <button className={`step-row ${step.id === selectedId ? "selected" : ""}`} aria-current={step.id === selectedId ? "step" : undefined} onClick={() => setSelectedId(step.id)}>
                <span className="step-number">{index + 1}</span><StepKindMark kind={step.kind} /><span className="step-name">{step.name}</span>
              </button>
              <div className="reorder-controls" aria-label={`Reorder ${step.name}`}>
                <button className="tiny-icon-button" aria-label={`Move ${step.name} up`} disabled={index === 0} onClick={() => moveStep(step.id, -1)}><Icon name="up" size={15} /></button>
                <button className="tiny-icon-button" aria-label={`Move ${step.name} down`} disabled={index === workflow.steps.length - 1} onClick={() => moveStep(step.id, 1)}><Icon name="down" size={15} /></button>
              </div>
            </li>)}
            {!workflow.steps.length && <li className="empty-steps">Add a step to begin.</li>}
          </ol>
          <div className="steps-panel-footer">
            <button className="text-button" onClick={() => importRef.current?.click()}><Icon name="upload" size={15} />Import JSON</button>
            <button className="text-button" onClick={() => downloadWorkflow(workflow)}><Icon name="download" size={15} />Export JSON</button>
          </div>
        </aside>

        <section className="canvas-region" aria-label="Workflow graph">
          <div className="canvas-scroll">
            <div className="graph" style={{ minHeight: `${Math.max(orderedSteps.length * 152 + 64, 360)}px`, transform: `scale(${zoom})` }}>
              <svg className="graph-connectors" aria-hidden="true" width="100%" height="100%" viewBox={`0 0 800 ${Math.max(orderedSteps.length * 152 + 64, 360)}`} preserveAspectRatio="none">
                <defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7d8790" /></marker></defs>
                {orderedSteps.flatMap((step, targetIndex) => step.dependsOn.map((dependency) => {
                  const sourceIndex = orderedSteps.findIndex((candidate) => candidate.id === dependency);
                  if (sourceIndex < 0) return null;
                  const sourceY = 64 + sourceIndex * 152 + 76;
                  const targetY = 64 + targetIndex * 152;
                  const middleY = Math.round((sourceY + targetY) / 2);
                  const direct = targetIndex === sourceIndex + 1;
                  const edge = direct ? "" : ` M 400 ${sourceY} V ${middleY} H ${targetIndex > sourceIndex ? 474 : 326} V ${targetY - 8}`;
                  return <path key={`${dependency}-${step.id}`} d={edge || `M 400 ${sourceY} V ${targetY - 8}`} fill="none" stroke="#8a949d" strokeWidth="1.6" markerEnd="url(#arrowhead)" />;
                }))}
              </svg>
              {orderedSteps.map((step, index) => <button key={step.id} className={`canvas-node ${step.id === selectedId ? "selected" : ""}`} style={{ top: `${64 + index * 152}px` }} onClick={() => setSelectedId(step.id)} aria-pressed={step.id === selectedId}>
                <StepKindMark kind={step.kind} /><span>{step.name}</span><small>{step.kind === "agent" ? agentNames[step.agentId] ?? step.agentId : kinds.find((kind) => kind.value === step.kind)?.label}</small>
              </button>)}
              {!orderedSteps.length && <p className="canvas-empty">Your workflow graph will appear here.</p>}
            </div>
          </div>
          <footer className="canvas-statusbar"><span>{workflow.steps.length} steps <span aria-hidden="true">·</span> {connections} connections</span><span className="zoom-controls"><button aria-label="Zoom out" onClick={() => setZoom((current) => Math.max(0.6, Math.round((current - 0.1) * 10) / 10))}>−</button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => setZoom((current) => Math.min(1.5, Math.round((current + 0.1) * 10) / 10))}>+</button><button aria-label="Reset graph zoom" onClick={() => setZoom(1)}><Icon name="fit" size={16} /></button></span></footer>
        </section>

        <aside className="inspector-panel" aria-label="Step properties">
          {selected ? <>
            <div className="inspector-heading"><div><p>Step properties</p><h2>{selected.name}</h2></div><button className="tiny-icon-button delete-step" aria-label={`Delete ${selected.name}`} title="Delete step" onClick={() => removeStep(selected.id)}><Icon name="trash" size={17} /></button></div>
            <div className="inspector-form">
              <label className="field"><span>Name</span><input maxLength={120} value={selected.name} onChange={(event) => updateStep(selected.id, (step) => ({ ...step, name: event.target.value }))} /></label>
              <label className="field"><span>Step type</span><select value={selected.kind} onChange={(event) => updateStep(selected.id, (step) => ({ ...step, kind: event.target.value as StepKind }))}>{kinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
              <label className="field"><span>{selected.kind === "agent" ? "Agent" : "Handler"}</span><select value={selected.agentId} onChange={(event) => updateStep(selected.id, (step) => ({ ...step, agentId: event.target.value }))}>{agents.map((agent) => <option key={agent} value={agent}>{agentNames[agent]}</option>)}</select></label>
              <fieldset className="field dependency-field"><legend>Depends on</legend>
                <div className="dependency-list">{workflow.steps.filter((step) => step.id !== selected.id).map((step) => <label key={step.id} className="dependency-choice"><input type="checkbox" checked={selected.dependsOn.includes(step.id)} onChange={(event) => updateStep(selected.id, (current) => ({ ...current, dependsOn: event.target.checked ? [...current.dependsOn, step.id] : current.dependsOn.filter((id) => id !== step.id) }))} /><span>{step.name}</span></label>)}</div>
                {!workflow.steps.some((step) => step.id !== selected.id) && <p className="field-hint">No other steps yet.</p>}
              </fieldset>
              <label className="field timeout-field"><span>Timeout</span><span className="input-unit"><input type="number" min={1} max={120} step={1} value={selected.timeoutMinutes} onChange={(event) => updateStep(selected.id, (step) => ({ ...step, timeoutMinutes: Number(event.target.value) }))} /><span>minutes</span></span></label>
              <fieldset className="field permissions-field"><legend>Permissions</legend>
                <div className="permission-group"><h3>Granted scopes</h3>{PERMISSIONS.map(({ id, label }) => <label className="permission-choice" key={id}><input type="checkbox" checked={selected.permissions.includes(id)} onChange={(event) => setPermission(id, event.target.checked)} /><span>{label}</span></label>)}</div>
                <p className="field-hint">Declared scopes are exported with this step. The host must enforce them when it executes the workflow.</p>
              </fieldset>
            </div>
          </> : <div className="inspector-empty"><p>No step selected</p><span>Select a step or add one to edit its properties.</span></div>}
        </aside>
      </div>
    </section>

    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="close" size={16} /></button></div>}

    <dialog ref={previewDialogRef} className="preview-dialog" aria-labelledby="preview-title" onClose={() => setPreview(null)} onClick={(event) => { if (event.target === event.currentTarget) previewDialogRef.current?.close(); }}>
      {preview && <>
        <div className="dialog-heading"><div><p>Workflow validation</p><h2 id="preview-title">Preview execution plan</h2></div><button className="tiny-icon-button" aria-label="Close preview" onClick={() => setPreview(null)}><Icon name="close" /></button></div>
        {preview.error ? <p className="validation-error" role="alert">{preview.error}</p> : <>
          <p className="preview-note">This is a dry preview. No agent, command or tool will run.</p>
          <ol className="preview-order">{preview.order!.map((id, index) => { const step = workflow.steps.find((candidate) => candidate.id === id)!; return <li key={id}><span className="preview-number">{index + 1}</span><StepKindMark kind={step.kind} /><span><strong>{step.name}</strong><small>{step.kind} · {step.timeoutMinutes} min timeout · {step.permissions.length} declared scopes</small></span></li>; })}</ol>
          <div className="dialog-footer"><span>{preview.order!.length} steps validated</span><button className="button button-primary" onClick={() => setPreview(null)}>Done</button></div>
        </>}
      </>}
    </dialog>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
