<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use Illuminate\Http\Request;

class ActionStatsController extends Controller
{
    // GET /api/actions/stats?zone_id=...
    public function index(Request $request)
    {
        $data = $request->validate([
            'zone_id' => ['required', 'integer', 'exists:zones,id'],
        ]);

        $zoneId = $data['zone_id'];

        $actions = Action::query()
            ->with('controller')
            ->where(function ($query) use ($zoneId) {
                $query->where('zone_id', $zoneId)
                    ->orWhereHas('controller', fn ($controllerQuery) => $controllerQuery->where('zone_id', $zoneId));
            })
            ->get();

        $stats = [
            'irrigation_volume_l' => 0.0,
            'irrigation_duration_s' => 0,
            'fertigation_volume_l' => 0.0,
            'fertigation_duration_s' => 0,
        ];

        foreach ($actions as $action) {
            $duration = $this->calculateDurationSeconds($action);
            $volume = $this->estimateVolumeLiters($action, $duration);

            $type = strtolower((string) $action->type);
            if ($type === 'irrigation') {
                $stats['irrigation_duration_s'] += $duration;
                $stats['irrigation_volume_l'] += $volume;
            } elseif ($type === 'fertigation') {
                $stats['fertigation_duration_s'] += $duration;
                $stats['fertigation_volume_l'] += $volume;
            }
        }

        return response()->json($stats);
    }

    private function calculateDurationSeconds(Action $action): int
    {
        $start = $action->started_at;
        $end = $action->ended_at;

        if ($start && $end) {
            return max(0, $end->diffInSeconds($start));
        }

        return 0;
    }

    private function estimateVolumeLiters(Action $action, int $durationSeconds): float
    {
        $parameters = $action->parameters ?? [];
        if (! is_array($parameters)) {
            return 0.0;
        }

        if (isset($parameters['volume_l'])) {
            return (float) $parameters['volume_l'];
        }

        if (isset($parameters['volume'])) {
            return (float) $parameters['volume'];
        }

        if (isset($parameters['flow_rate_lpm'])) {
            return (float) $parameters['flow_rate_lpm'] * ($durationSeconds / 60);
        }

        return 0.0;
    }
}
