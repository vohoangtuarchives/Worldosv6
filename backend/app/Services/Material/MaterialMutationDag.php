<?php

namespace App\Services\Material;

use App\Models\Material;
use App\Models\MaterialMutation;

/**
 * Mutation DAG: given context (epoch, innovation, event), return which child materials can trigger.
 */
class MaterialMutationDag
{
    /**
     * Get materials that can mutate from parent given context.
     *
     * @return array<int, Material> Child materials keyed by id
     */
    public function getTriggeredChildren(Material $parent, array $context): array
    {
        $mutations = MaterialMutation::where('parent_material_id', $parent->id)
            ->with('childMaterial')
            ->get();

        $result = [];
        foreach ($mutations as $mutation) {
            if ($this->evaluateTrigger($mutation->trigger_condition, $context)
                && $this->evaluateContextConstraint($mutation->context_constraint, $context)) {
                $result[$mutation->child_material_id] = $mutation->childMaterial;
            }
        }
        return $result;
    }

    protected function evaluateTrigger(?string $condition, array $context): bool
    {
        if (empty($condition)) {
            return true;
        }
        if (preg_match('/innovation\s*>\s*([\d.]+)/', $condition, $m)) {
            return ($context['innovation'] ?? 0) > (float) $m[1];
        }
        if (preg_match('/epoch\s*>\s*(\d+)/', $condition, $m)) {
            return ($context['epoch'] ?? 0) > (int) $m[1];
        }
        return false;
    }

    protected function evaluateContextConstraint(?array $constraint, array $context): bool
    {
        if (empty($constraint)) {
            return true;
        }
        foreach ($constraint as $key => $required) {
            if (($context[$key] ?? null) !== $required) {
                return false;
            }
        }
        return true;
    }
}
