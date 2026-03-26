'use client';

const layers = [
  'Material conditions',
  'Institutional pressure',
  'Narrative memory',
  'Actor intention',
  'Axiom drift',
];

const ManifoldViz = () => {
  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Manifold View</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Multi-layer causal topology</h2>
      <div className="mt-6 grid h-[380px] gap-4 md:grid-cols-2">
        {layers.map((layer, index) => (
          <div key={layer} className="rounded-[24px] border border-white/8 bg-gradient-to-br from-primary/8 via-background/35 to-transparent p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Layer {index + 1}</p>
            <h3 className="mt-2 text-lg font-medium">{layer}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This stable placeholder reserves space for future topological rendering without carrying impure render logic.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ManifoldViz;
