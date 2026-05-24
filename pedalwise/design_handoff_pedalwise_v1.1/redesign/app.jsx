/* global React, DesignCanvas, DCSection, DCArtboard,
   CritiqueSlate, PersonaShell, DIYGuidedFit, FitterStudio,
   EngineerWorkbench, UnifiedWorkspace, BikeFitReport, DevHandoff */

function App() {
  return (
    <DesignCanvas
      bg="var(--sand-25)"
      title="Pedalwise · design review"
      subtitle="v1.0 → v1.1 — six findings · seven surfaces redesigned"
    >
      <DCSection
        id="review"
        title="01 · The review"
        subtitle="What's working, what isn't, and the thesis"
      >
        <DCArtboard id="critique" label="A · Critique slate" width={1100} height={680}>
          <CritiqueSlate/>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="entry"
        title="02 · New entry · persona-routed shell"
        subtitle="First-run picker — engineer / fitter / DIY rider each get a tailored workspace"
      >
        <DCArtboard id="shell" label="A · Persona picker" width={1280} height={820}>
          <PersonaShell/>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="persona-workspaces"
        title="03 · The three workspaces"
        subtitle="Same kinematic model, tailored chrome per audience"
      >
        <DCArtboard id="diy" label="A · DIY Guided Fit" width={1400} height={900}>
          <DIYGuidedFit/>
        </DCArtboard>
        <DCArtboard id="fitter" label="B · Fitter Studio" width={1440} height={900}>
          <FitterStudio/>
        </DCArtboard>
        <DCArtboard id="engineer" label="C · Engineer Workbench" width={1440} height={900}>
          <EngineerWorkbench/>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="universal"
        title="04 · Refined universal workspace"
        subtitle="The Anatomical view, with promoted HUD, delta-first optimizer, integrated triangle"
      >
        <DCArtboard id="workspace" label="A · Anatomical · refined" width={1440} height={1100}>
          <UnifiedWorkspace/>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="report"
        title="05 · Printable handoff"
        subtitle="Branded fitter report a client takes to their mechanic"
      >
        <DCArtboard id="report-doc" label="A · Bike-fit report · Letter" width={820} height={1060}>
          <BikeFitReport/>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="dev-handoff"
        title="06 · Developer handoff"
        subtitle="Every recommendation as a ticket, mapped to files in pedalwise/"
      >
        <DCArtboard id="tickets" label="A · Tickets · v1.0 → v1.1" width={1400} height={1800}>
          <DevHandoff/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
