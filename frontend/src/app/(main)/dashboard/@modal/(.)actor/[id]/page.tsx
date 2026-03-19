import { ActorDetail } from "@/components/Simulation/ActorDetail";
import { Modal } from "@/components/ui/modal";

export default function ActorModal({ params }: { params: { id: string } }) {
  return (
    <Modal title="Chi tiết Nhân vật">
       <ActorDetail actorId={parseInt(params.id)} />
    </Modal>
  );
}
