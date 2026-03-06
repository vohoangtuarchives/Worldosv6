<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Full 15 Core + 4 Meta Civilization Attractor Seeder
 *
 * 15 Core Attractors: Survival, Energy, Reproduction, Cooperation, Competition,
 *   Hierarchy, Trade, Knowledge, Technology, Culture, Meaning, Stability,
 *   Exploration, Innovation, Collapse
 *
 * 4 Meta Attractors: Complexity, Intelligence, Expansion, Transcendence
 *
 * force_map keys = event_types used by EventTriggerProcessor
 * field_bias = which of the 5 CivilizationFields this attractor amplifies
 */
class CivilizationAttractorFullSeeder extends Seeder
{
    public function run(): void
    {
        $attractors = [
            // ===============================
            // 15 CORE CIVILIZATION ATTRACTORS
            // ===============================
            [
                'name'             => 'survival',
                'description'      => 'Lực cơ bản nhất: tồn tại lâu nhất. Tạo ra tribe, migration, defensive alliances.',
                'activation_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.4],
                ],
                'force_map'  => ['crisis' => 0.7, 'unrest' => 0.5, 'formation' => 0.4],
                'decay_rate' => 0.01,
                'field_bias' => 'survival',
            ],
            [
                'name'             => 'energy',
                'description'      => 'Actor bị hút tới nơi có năng lượng cao: đất màu, khoáng sản. Sinh ra settlement, agriculture.',
                'activation_rules' => [
                    ['key' => 'resource_density', 'op' => '>=', 'value' => 0.5],
                ],
                'force_map'  => ['formation' => 0.6, 'golden_age' => 0.4],
                'decay_rate' => 0.015,
                'field_bias' => 'wealth',
            ],
            [
                'name'             => 'reproduction',
                'description'      => 'Sinh tồn dài hạn đòi hỏi dân số tăng. Sinh ra family, clan, kinship system.',
                'activation_rules' => [
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.5],
                    ['key' => 'entropy',          'op' => '<=', 'value' => 0.5],
                ],
                'force_map'  => ['formation' => 0.5, 'golden_age' => 0.3],
                'decay_rate' => 0.01,
                'field_bias' => 'survival',
            ],
            [
                'name'             => 'cooperation',
                'description'      => 'Nhiều vấn đề chỉ giải được khi hợp tác. Sinh ra tribe, guild, collective labor.',
                'activation_rules' => [
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.55],
                ],
                'force_map'  => ['formation' => 0.7, 'golden_age' => 0.5],
                'decay_rate' => 0.015,
                'field_bias' => 'power',
            ],
            [
                'name'             => 'competition',
                'description'      => 'Nguồn lực hạn chế dẫn đến cạnh tranh. Sinh ra war, rivalry, territory.',
                'activation_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.5],
                    ['key' => 'stability_index', 'op' => '<=', 'value' => 0.5],
                ],
                'force_map'  => ['crisis' => 0.8, 'secession' => 0.5, 'collapse' => 0.4],
                'decay_rate' => 0.02,
                'field_bias' => 'power',
            ],
            [
                'name'             => 'hierarchy',
                'description'      => 'Nhóm lớn cần structure. Sinh ra leader, chief, king, bureaucracy.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.6],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.55],
                ],
                'force_map'  => ['formation' => 0.6, 'golden_age' => 0.5],
                'decay_rate' => 0.01,
                'field_bias' => 'power',
            ],
            [
                'name'             => 'trade',
                'description'      => 'Hai vùng resource khác nhau → trao đổi. Sinh ra market, merchant, trade route, currency.',
                'activation_rules' => [
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.5],
                    ['key' => 'entropy',          'op' => '<=', 'value' => 0.55],
                ],
                'force_map'  => ['formation' => 0.5, 'golden_age' => 0.6],
                'decay_rate' => 0.015,
                'field_bias' => 'wealth',
            ],
            [
                'name'             => 'knowledge',
                'description'      => 'Actor bị hút về nơi có information density cao. Sinh ra teacher, school, library, science.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.65],
                ],
                'force_map'  => ['golden_age' => 0.7, 'formation' => 0.4, 'meta_cycle' => -0.2],
                'decay_rate' => 0.01,
                'field_bias' => 'knowledge',
            ],
            [
                'name'             => 'technology',
                'description'      => 'Actor tìm cách làm hiệu quả hơn. Sinh ra tools, engineering, machines, automation.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.7],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.6],
                ],
                'force_map'  => ['golden_age' => 0.8, 'formation' => 0.5],
                'decay_rate' => 0.01,
                'field_bias' => 'knowledge',
            ],
            [
                'name'             => 'culture',
                'description'      => 'Nhóm người cần bản sắc chung. Sinh ra language, ritual, symbol, tradition.',
                'activation_rules' => [
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.5],
                    ['key' => 'entropy',          'op' => '<=', 'value' => 0.5],
                ],
                'force_map'  => ['formation' => 0.4, 'golden_age' => 0.5, 'ascension' => 0.3],
                'decay_rate' => 0.01,
                'field_bias' => 'meaning',
            ],
            [
                'name'             => 'meaning',
                'description'      => 'Actor tìm ý nghĩa tồn tại. Sinh ra religion, myth, philosophy, art. Kích hoạt khi entropy cao.',
                'activation_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.5],
                ],
                'force_map'  => ['formation' => 0.3, 'ascension' => 0.6, 'eschaton' => 0.4],
                'decay_rate' => 0.005,
                'field_bias' => 'meaning',
            ],
            [
                'name'             => 'stability',
                'description'      => 'Hệ phức tạp cố giảm entropy. Sinh ra law, norms, institutions, governance.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.6],
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.45],
                ],
                'force_map'  => ['golden_age' => 0.6, 'formation' => 0.4],
                'decay_rate' => 0.01,
                'field_bias' => 'power',
            ],
            [
                'name'             => 'exploration',
                'description'      => 'Nếu resource cạn → tìm vùng mới. Sinh ra exploration, colonization, navigation.',
                'activation_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.55],
                    ['key' => 'resource_density', 'op' => '<=', 'value' => 0.45],
                ],
                'force_map'  => ['secession' => 0.5, 'micro_mode' => 0.4, 'formation' => 0.5],
                'decay_rate' => 0.02,
                'field_bias' => 'survival',
            ],
            [
                'name'             => 'innovation',
                'description'      => 'Một số actor luôn muốn thử cái mới. Sinh ra scientific revolution, cultural change.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.75],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.6],
                ],
                'force_map'  => ['golden_age' => 0.9, 'ascension' => 0.5],
                'decay_rate' => 0.015,
                'field_bias' => 'knowledge',
            ],
            [
                'name'             => 'collapse',
                'description'      => 'Mọi hệ phức tạp đều có lực sụp đổ. Khi entropy > stability → collapse attractor dominant.',
                'activation_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.75],
                    ['key' => 'stability_index', 'op' => '<=', 'value' => 0.3],
                ],
                'force_map'  => ['collapse' => 0.9, 'secession' => 0.7, 'crisis' => 0.8, 'meta_cycle' => 0.6],
                'decay_rate' => 0.03,
                'field_bias' => null,
            ],

            // ========================
            // 4 META CIVILIZATION ATTRACTORS
            // ========================
            [
                'name'             => 'meta_complexity',
                'description'      => '[META] Lực khiến civilization tăng độ phức tạp: tribe → city → empire → digital.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.8],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.65],
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.4],
                ],
                'force_map'  => ['golden_age' => 1.0, 'ascension' => 0.8, 'formation' => 0.6],
                'decay_rate' => 0.005,
                'field_bias' => 'knowledge',
            ],
            [
                'name'             => 'meta_intelligence',
                'description'      => '[META] Civilization hướng tới trí tuệ cao hơn: collective → artificial → superintelligence.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.85],
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.35],
                ],
                'force_map'  => ['ascension' => 1.0, 'golden_age' => 0.8],
                'decay_rate' => 0.005,
                'field_bias' => 'knowledge',
            ],
            [
                'name'             => 'meta_expansion',
                'description'      => '[META] Civilization mở rộng không gian sống: territorial → colonial → interplanetary.',
                'activation_rules' => [
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.7],
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.7],
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.4],
                ],
                'force_map'  => ['secession' => 0.4, 'formation' => 0.8, 'golden_age' => 0.7],
                'decay_rate' => 0.005,
                'field_bias' => 'survival',
            ],
            [
                'name'             => 'meta_transcendence',
                'description'      => '[META] Civilization vượt qua giới hạn sinh học: biological → cybernetic → digital → energy-based.',
                'activation_rules' => [
                    ['key' => 'sci', 'op' => '>=', 'value' => 0.9],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.8],
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.2],
                ],
                'force_map'  => ['ascension' => 1.0, 'eschaton' => 0.5],
                'decay_rate' => 0.002,
                'field_bias' => 'meaning',
            ],
        ];

        foreach ($attractors as $row) {
            $insert = [
                'name'             => $row['name'],
                'description'      => $row['description'],
                'activation_rules' => json_encode($row['activation_rules']),
                'force_map'        => json_encode($row['force_map']),
                'decay_rate'       => $row['decay_rate'],
            ];
            DB::table('civilization_attractors')->updateOrInsert(
                ['name' => $row['name']],
                $insert
            );
        }

        $this->command?->info('✅ CivilizationAttractorFullSeeder: 15 core + 4 meta attractors seeded.');
    }
}
