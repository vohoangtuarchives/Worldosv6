'use client';

const peaks = [
  { name: 'North Ridge', elevation: '1.2 km' },
  { name: 'Archive Plateau', elevation: '0.8 km' },
  { name: 'Glass Basin', elevation: '0.3 km' },
  { name: 'Southern Shelf', elevation: '0.5 km' },
];

const TopographicMap = () => {
  return (
    <section className="rounded-[28px] border border-white/10 bg-card/45 p-6 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Topography</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Terrain snapshot</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {peaks.map((peak) => (
          <div key={peak.name} className="rounded-2xl border border-white/8 bg-background/35 p-5">
            <p className="text-base font-medium">{peak.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">Elevation band: {peak.elevation}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopographicMap;
