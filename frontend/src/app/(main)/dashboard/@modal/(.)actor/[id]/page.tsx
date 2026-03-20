import { ActorDetail } from "@/components/Simulation/ActorDetail";
import { Modal } from "@/components/ui/modal";

export default async function ActorModal({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const actorId = typeof rawId === 'string' && rawId.includes('_') 
    ? parseInt(rawId.split('_').pop() || '') 
    : parseInt(rawId || '');

  if (isNaN(actorId) || actorId <= 0) {
    return (
      <Modal title="Lỗi">
        <div className="p-8 text-center text-red-500 font-bold">
           ID Nhân vật không hợp lệ: {rawId}
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Chi tiết Nhân vật">
       <ActorDetail actorId={actorId} />
    </Modal>
  );
}
