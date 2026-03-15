<?php

namespace App\Services\Simulation;

use Illuminate\Support\Facades\File;

class RuleGraphService
{
    /**
     * Parse all DSL files and build a dependency graph.
     */
    public function buildGraph(string $rulesDirectory): array
    {
        $files = File::allFiles($rulesDirectory);
        $graph = [
            'nodes' => [], // { id, label, type: "rule" | "field" }
            'edges' => [], // { source, target, type: "trigger" | "modify" | "read" }
        ];

        $rules = [];
        $fields = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'dsl') continue;
            
            $content = $file->getContents();
            $fileRules = $this->parseDsl($content, $file->getRelativePathname());
            
            foreach ($fileRules as $rule) {
                $ruleId = "rule:" . $rule['name'];
                $graph['nodes'][] = [
                    'id' => $ruleId,
                    'label' => $rule['name'],
                    'type' => 'rule',
                    'file' => $rule['file'],
                    'category' => $rule['category'] ?? 'general'
                ];

                // Triggers (Field -> Rule)
                foreach ($rule['triggers'] as $trigger) {
                    $fieldId = "field:" . $trigger;
                    $fields[$trigger] = true;
                    $graph['edges'][] = [
                        'id' => "e:{$fieldId}->{$ruleId}",
                        'source' => $fieldId,
                        'target' => $ruleId,
                        'type' => 'trigger'
                    ];
                }

                // Modifications (Rule -> Field)
                foreach ($rule['modifications'] as $mod) {
                    $fieldId = "field:" . $mod;
                    $fields[$mod] = true;
                    $graph['edges'][] = [
                        'id' => "e:{$ruleId}->{$fieldId}",
                        'source' => $ruleId,
                        'target' => $fieldId,
                        'type' => 'modify'
                    ];
                }
                
                // Reads (Field -> Rule) - from 'when' clauses or formulas
                foreach ($rule['reads'] as $read) {
                    $fieldId = "field:" . $read;
                    if (!in_array($read, $rule['triggers'])) {
                        $fields[$read] = true;
                        $graph['edges'][] = [
                            'id' => "e:{$fieldId}->{$ruleId}",
                            'source' => $fieldId,
                            'target' => $ruleId,
                            'type' => 'read'
                        ];
                    }
                }
            }
        }

        foreach (array_keys($fields) as $field) {
            $graph['nodes'][] = [
                'id' => "field:" . $field,
                'label' => $field,
                'type' => 'field'
            ];
        }

        return $graph;
    }

    protected function parseDsl(string $content, string $filename): array
    {
        $rules = [];
        // Split by 'rule ' but keep the delimiter
        $chunks = preg_split('/(?=rule\s+)/', $content);

        foreach ($chunks as $chunk) {
            if (!preg_match('/rule\s+([a-zA-Z0-9_]+)/', $chunk, $matches)) continue;
            
            $ruleName = $matches[1];
            $rule = [
                'name' => $ruleName,
                'file' => $filename,
                'triggers' => [],
                'modifications' => [],
                'reads' => [],
                'category' => null
            ];

            // Category
            if (preg_match('/category\s+([a-zA-Z0-9_]+)/', $chunk, $m)) {
                $rule['category'] = $m[1];
            }

            // Triggers
            if (preg_match_all('/trigger\s+([a-zA-Z0-9_\.]+)/', $chunk, $m)) {
                $rule['triggers'] = array_unique($m[1]);
            }

            // Modifications (drift, set)
            if (preg_match_all('/(?:drift|set)\s+([a-zA-Z0-9_\.]+)/', $chunk, $m)) {
                $rule['modifications'] = array_unique($m[1]);
            }

            // Reads (when, formula)
            // This is a naive regex, might need refinement for complex formulas
            if (preg_match_all('/(?:when|formula)\s+.*?\b([a-zA-Z0-9_]+\.[a-zA-Z0-9_\.]+)\b/', $chunk, $m)) {
                 $rule['reads'] = array_merge($rule['reads'], $m[1]);
            }
            if (preg_match_all('/(?:when|formula)\s+.*?\b(field_[a-zA-Z0-9_]+)\b/', $chunk, $m)) {
                 $rule['reads'] = array_merge($rule['reads'], $m[1]);
            }
            
            $rule['reads'] = array_unique($rule['reads']);
            $rules[] = $rule;
        }

        return $rules;
    }
}
