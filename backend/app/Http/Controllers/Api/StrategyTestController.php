<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StrategyDefinition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class StrategyTestController extends Controller
{
    // POST /api/strategies/test
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(StrategyDefinition::TYPES)],
            'params' => ['nullable', 'array'],
            'inputs' => ['required', 'array'],
        ]);

        $params = $validated['params'] ?? [];

        $rules = StrategyDefinition::paramRules($validated['type']);
        Validator::make($params, $rules)->validate();

        $decision = $this->simulateDecision($validated['type'], $params, $validated['inputs']);

        return response()->json($decision);
    }

    private function simulateDecision(string $type, array $params, array $inputs): array
    {
        $type = strtoupper($type);
        $soilMoisture = $inputs['soil_moisture'] ?? null;

        $decision = 'NO_ACTION';
        $durationMinutes = 0;
        $intensityPercent = 0;

        if ($type === 'THRESHOLD') {
            $min = $params['threshold_min'] ?? null;
            $max = $params['threshold_max'] ?? null;
            if ($soilMoisture !== null && $min !== null && $soilMoisture < $min) {
                $decision = 'IRRIGATE';
                $durationMinutes = max(5, (int) round(($min - $soilMoisture) * 2));
                $intensityPercent = 100;
            } elseif ($soilMoisture !== null && $max !== null && $soilMoisture > $max) {
                $decision = 'SKIP';
            }
        } elseif ($type === 'FUZZY') {
            $rainfall = $inputs['rainfall'] ?? 0;
            $et0 = $inputs['et0'] ?? $inputs['et0_daily'] ?? null;
            if ($soilMoisture !== null && $soilMoisture < 35 && $rainfall < 5) {
                $decision = 'IRRIGATE';
                $durationMinutes = 30;
                $intensityPercent = $et0 !== null ? 80 : 60;
            } else {
                $decision = 'NO_ACTION';
            }
        } elseif ($type === 'EVAPOTRANSPIRATION' || $type === 'ET') {
            $trigger = $params['trigger_deficit_mm'] ?? 20;
            $deficit = $inputs['deficit_mm'] ?? null;
            if ($deficit === null && isset($inputs['et0'], $inputs['rainfall'])) {
                $kc = $params['et_coefficient'] ?? 1;
                $deficit = max(0, ($inputs['et0'] * $kc) - $inputs['rainfall']);
            }

            if ($deficit !== null && $deficit >= $trigger) {
                $decision = 'IRRIGATE';
                $durationMinutes = min(120, (int) round($deficit * 2));
                $intensityPercent = 100;
            }
        } elseif ($type === 'MANUAL') {
            $decision = $params ? 'IRRIGATE' : 'NO_ACTION';
            $durationMinutes = $params['duration_minutes'] ?? 0;
            $intensityPercent = $params['intensity_percent'] ?? 100;
        }

        return [
            'decision' => $decision,
            'duration_minutes' => $durationMinutes,
            'intensity_percent' => $intensityPercent,
        ];
    }
}
