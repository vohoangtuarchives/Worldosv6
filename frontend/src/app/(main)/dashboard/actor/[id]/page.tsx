import { ActorDetail } from "@/components/Simulation/ActorDetail";

export default async function ActorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const actorId = typeof rawId === 'string' && rawId.includes('_') 
    ? parseInt(rawId.split('_').pop() || '') 
    : parseInt(rawId || '');

  if (isNaN(actorId) || actorId <= 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">ID Nhân vật không hợp lệ: {rawId}</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-5xl">
       <ActorDetail actorId={actorId} />
    </div>
  );
}
