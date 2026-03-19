import { ActorDetail } from "@/components/Simulation/ActorDetail";

export default function ActorPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-8 max-w-5xl">
       <ActorDetail actorId={parseInt(params.id)} />
    </div>
  );
}
