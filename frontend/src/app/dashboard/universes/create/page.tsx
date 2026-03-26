import React from 'react';
import { AxiomWorkshop } from './AxiomWorkshop';

export const metadata = {
  title: 'Axiom Workshop | WorldOS Observer',
  description: 'Create a new universe from the void.',
};

export default function CreateUniversePage() {
  return (
    <div className="container py-10 px-6">
      <AxiomWorkshop />
    </div>
  );
}
