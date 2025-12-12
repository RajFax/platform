<?php

namespace App\Support;

class StrategyDefinition
{
    public const TYPES = [
        'MANUAL',
        'THRESHOLD',
        'FUZZY',
        'EVAPOTRANSPIRATION',
        'ET',
    ];

    public static function paramRules(string $type): array
    {
        return match ($type) {
            'THRESHOLD' => [
                'sensor_id' => ['required', 'integer', 'exists:sensors,id'],
                'threshold_min' => ['required', 'numeric'],
                'threshold_max' => ['required', 'numeric'],
                'controller_id' => ['required', 'integer', 'exists:controllers,id'],
            ],
            'FUZZY' => [
                'inputs' => ['required', 'array'],
                'inputs.soil_sensor_id' => ['required', 'integer', 'exists:sensors,id'],
                'inputs.et0_sensor_id' => ['nullable', 'integer', 'exists:sensors,id'],
                'inputs.rain_sensor_id' => ['nullable', 'integer', 'exists:sensors,id'],
                'rules' => ['nullable', 'array'],
                'controller_id' => ['required', 'integer', 'exists:controllers,id'],
            ],
            'EVAPOTRANSPIRATION', 'ET' => [
                'et_coefficient' => ['required', 'numeric'],
                'trigger_deficit_mm' => ['required', 'numeric'],
                'controller_id' => ['required', 'integer', 'exists:controllers,id'],
            ],
            default => [
                'controller_id' => ['nullable', 'integer', 'exists:controllers,id'],
            ],
        };
    }
}
