<?php

namespace App\Modules\WorldOS\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Narrative\Contracts\ChronicleRepositoryInterface;
use App\Modules\Narrative\Contracts\MythScarRepositoryInterface;
use App\Modules\Narrative\Contracts\ArtifactRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NarrativeController extends Controller
{
    public function __construct(
        private ChronicleRepositoryInterface $chronicleRepo,
        private MythScarRepositoryInterface $mythScarRepo,
        private ArtifactRepositoryInterface $artifactRepo
    ) {}

    public function chronicles(int $universeId): JsonResponse
    {
        $chronicles = $this->chronicleRepo->findByUniverse($universeId);
        return response()->json($chronicles);
    }

    public function mythScars(int $universeId): JsonResponse
    {
        $scars = $this->mythScarRepo->findByUniverse($universeId);
        return response()->json($scars);
    }

    public function artifacts(int $universeId): JsonResponse
    {
        $artifacts = $this->artifactRepo->findByUniverse($universeId);
        return response()->json($artifacts);
    }
}
