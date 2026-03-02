<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WorldOS Genres Configuration
    |--------------------------------------------------------------------------
    |
    | Genres now act as Phase Attractors in a multidimensional state space.
    | The 'attractors' array defines the ideal coordinate for each genre.
    | Space dimensions (normalized 0.0 - 1.0):
    | - spirituality: Reliance on mysticism, internal energy.
    | - hardtech: Reliance on external machinery, science.
    | - entropy: General disorder/evolution stage of the universe.
    | - energy_level: Total power capacity (magic or tech).
    |
    */

    'genres' => [
        // ==========================
        // HISTORICAL & MARTIAL PATH
        // ==========================
        'historical' => [
            'name' => 'Dã Sử (Historical Fiction)',
            'description' => 'Xã hội phong kiến cổ đại, không có yếu tố siêu nhiên, phát triển dựa trên chính trị và mưu lược.',
            'base_physical_cap' => 5,
            'naming_style' => 'asian_classic',
            'archetypes' => ['Mưu Sĩ', 'Quản Gia', 'Thư Sinh', 'Lệnh Tôn'],
            'attractors' => [
                'spirituality' => 0.2,
                'hardtech' => 0.1,
                'entropy' => 0.2,
                'energy_level' => 0.1,
            ]
        ],
        'military_history' => [
            'name' => 'Lịch Sử Quân Sự (Military History)',
            'description' => 'Thời kỳ chiến tranh, tập trung vào chiến thuật, binh pháp và vũ khí công thành.',
            'base_physical_cap' => 10,
            'naming_style' => 'asian_classic',
            'archetypes' => ['Thống Soái', 'Kiêu Tướng', 'Sát Thủ', 'Chiến Binh'],
            'attractors' => [
                'spirituality' => 0.1,
                'hardtech' => 0.3,
                'entropy' => 0.6,
                'energy_level' => 0.15,
            ]
        ],
        'wuxia' => [
            'name' => 'Kiếm Hiệp (Wuxia)',
            'description' => 'Thế giới võ hiệp giang hồ, nơi võ năng và bang phái quyết định trật tự.',
            'base_physical_cap' => 15,
            'naming_style' => 'asian_classic',
            'archetypes' => ['Võ Sư', 'Kiếm Khách', 'Tà Tu', 'Bang Chủ', 'Hiệp Khách'],
            'attractors' => [
                'spirituality' => 0.6,
                'hardtech' => 0.1,
                'entropy' => 0.4,
                'energy_level' => 0.3,
            ]
        ],
        'high_martial' => [
            'name' => 'Cao Võ (High Martial Arts)',
            'description' => 'Võ thuật đạt cảnh giới siêu phàm, mượn sức mạnh thiên địa.',
            'base_physical_cap' => 50,
            'naming_style' => 'asian_classic',
            'archetypes' => ['Tông Sư', 'Võ Thánh', 'Tuyệt Thế Cao Thủ'],
            'attractors' => [
                'spirituality' => 0.75,
                'hardtech' => 0.1,
                'entropy' => 0.5,
                'energy_level' => 0.6,
            ]
        ],
        'xianxia' => [
            'name' => 'Tiên Hiệp (Xianxia)',
            'description' => 'Thế giới tu chân, truy cầu trường sinh bất lão, phi thiên độn địa.',
            'base_physical_cap' => 1000,
            'naming_style' => 'asian_mythic',
            'archetypes' => ['Luyện Khí Sĩ', 'Tán Tiên', 'Thiên Ma', 'Yêu Vương', 'Thánh Nữ'],
            'attractors' => [
                'spirituality' => 0.95,
                'hardtech' => 0.05,
                'entropy' => 0.6,
                'energy_level' => 0.95,
            ]
        ],

        // ==========================
        // URBAN & MODERN PATH
        // ==========================
        'slice_of_life' => [
            'name' => 'Sinh Hoạt Đời Sống (Slice of Life)',
            'description' => 'Xã hội yên bình, tập trung vào các mối quan hệ gia đình, tình cảm và nghề nghiệp đời thường.',
            'base_physical_cap' => 5,
            'naming_style' => 'modern',
            'archetypes' => ['Nhân Viên Văn Phòng', 'Bà Nội Trợ', 'Học Sinh', 'Bác Sĩ'],
            'attractors' => [
                'spirituality' => 0.05,
                'hardtech' => 0.4,
                'entropy' => 0.1,
                'energy_level' => 0.05,
            ]
        ],
        'showbiz' => [
            'name' => 'Giới Giải Trí (Showbiz)',
            'description' => 'Thế giới của thần tượng, diễn viên, truyền thông và hào quang mạng xã hội.',
            'base_physical_cap' => 5,
            'naming_style' => 'modern',
            'archetypes' => ['Idol', 'Đạo Diễn', 'Paparazzi', 'Tổng Tài', 'Fan Cuồng'],
            'attractors' => [
                'spirituality' => 0.05,
                'hardtech' => 0.5,
                'entropy' => 0.3,
                'energy_level' => 0.1,
            ]
        ],
        'urban' => [
            'name' => 'Đô Thị Hiện Đại (Urban Modern)',
            'description' => 'Xã hội loài người hiện đại, guồng quay của tư bản, kinh tế và công nghệ cơ bản.',
            'base_physical_cap' => 5,
            'naming_style' => 'modern',
            'archetypes' => ['Thương Nhân', 'Tài Phiệt', 'Học Bá', 'Lưu Manh'],
            'attractors' => [
                'spirituality' => 0.1,
                'hardtech' => 0.6,
                'entropy' => 0.4,
                'energy_level' => 0.15,
            ]
        ],
        'urban_martial' => [
            'name' => 'Đô Thị Võ Thuật (Urban Martial)',
            'description' => 'Thế giới ngầm đô thị ẩn tàng Cổ võ giả và các thế gia luyện võ.',
            'base_physical_cap' => 20,
            'naming_style' => 'modern',
            'archetypes' => ['Cổ Võ Thế Gia', 'Quyền Thủ Mật', 'Đại Ca Giới Ngầm'],
            'attractors' => [
                'spirituality' => 0.3,
                'hardtech' => 0.6,
                'entropy' => 0.5,
                'energy_level' => 0.3,
            ]
        ],
        'urban_esper' => [
            'name' => 'Đô Thị Dị Năng (Urban Esper)',
            'description' => 'Thế giới hiện đại có những dạng đột biến gen hoặc đánh thức siêu năng lực (Dị năng).',
            'base_physical_cap' => 30,
            'naming_style' => 'modern',
            'archetypes' => ['Dị Năng Giả', 'Thợ Săn Tiền Thưởng', 'Dị Chủng', 'Nhà Nghiên Cứu Lõi'],
            'attractors' => [
                'spirituality' => 0.4,
                'hardtech' => 0.6,
                'entropy' => 0.5,
                'energy_level' => 0.4,
            ]
        ],
        'reiki_revival' => [
            'name' => 'Linh Khí Khôi Phục (Reiki Revival)',
            'description' => 'Biến cố vũ trụ làm linh khí hồi sinh trên địa cầu. Vạn vật dị biến, nhân loại bước vào kỷ nguyên thần thoại mới.',
            'base_physical_cap' => 150,
            'naming_style' => 'modern',
            'archetypes' => ['Kẻ Thức Tỉnh', 'Trọng Sinh Giả', 'Dị Thú Vương', 'Cường Giả Vạn Tộc'],
            'attractors' => [
                'spirituality' => 0.8,
                'hardtech' => 0.4,
                'entropy' => 0.9,
                'energy_level' => 0.8,
            ]
        ],

        // ==========================
        // APOCALYPTIC & SCI-FI PATH
        // ==========================
        'apocalypse' => [
            'name' => 'Mạt Thế (Apocalypse)',
            'description' => 'Nền văn minh sụp đổ do virus, thiên tai hoặc quái vật. Đạo đức sụp đổ, sinh tồn là mục tiêu duy nhất.',
            'base_physical_cap' => 15,
            'naming_style' => 'modern',
            'archetypes' => ['Kẻ Sống Sót', 'Lãnh Chúa Khu Ổ Chuột', 'Tiến Sĩ Điên', 'Đột Biến Thể'],
            'attractors' => [
                'spirituality' => 0.1,
                'hardtech' => 0.3,
                'entropy' => 0.95,
                'energy_level' => 0.2,
            ]
        ],
        'cyberpunk' => [
            'name' => 'Cyberpunk',
            'description' => 'High tech, low life. Sự thống trị của Siêu tập đoàn và công nghệ cấy ghép.',
            'base_physical_cap' => 20,
            'naming_style' => 'numerical',
            'archetypes' => ['Hacker', 'Cyber-Psycho', 'Mercenary', 'Corp Executive'],
            'attractors' => [
                'spirituality' => 0.05,
                'hardtech' => 0.85,
                'entropy' => 0.8,
                'energy_level' => 0.4,
            ]
        ],
        'sci_fi' => [
            'name' => 'Khoa Học Viễn Tưởng (Sci-Fi)',
            'description' => 'Văn minh du hành vũ trụ, thao túng năng lượng cấp độ hành tinh.',
            'base_physical_cap' => 500,
            'naming_style' => 'numerical',
            'archetypes' => ['Hạm Trưởng', 'Nhà Khoa Học', 'AI Tối Cao', 'Thợ Săn Tiền Thưởng'],
            'attractors' => [
                'spirituality' => 0.1,
                'hardtech' => 0.95,
                'entropy' => 0.5,
                'energy_level' => 0.9,
            ]
        ],
    ]
];
