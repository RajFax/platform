<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;

class ZoneKpiController extends Controller
{
    // GET /api/zones/{zone}/kpi
    public function show(Zone $zone)
    {
        $zone->load('parcel');

        $soilSensor = $zone->sensors()
            ->where('type', 'soil_moisture')
            ->orderBy('id')
            ->first();

        $latestMeasurement = $soilSensor?->measurements()
            ->latest('measured_at')
            ->latest('id')
            ->first();

        $soilMoisture = $latestMeasurement?->value;
        $targetMin = $zone->parcel?->target_soil_moisture_min;
        $targetMax = $zone->parcel?->target_soil_moisture_max;

        $deviation = null;
        if ($soilMoisture !== null) {
            if ($targetMin !== null && $soilMoisture < $targetMin) {
                $deviation = $soilMoisture - $targetMin;
            } elseif ($targetMax !== null && $soilMoisture > $targetMax) {
                $deviation = $soilMoisture - $targetMax;
            } else {
                $deviation = 0.0;
            }
        }

        return response()->json([
            'soil_moisture' => $soilMoisture,
            'target_min' => $targetMin,
            'target_max' => $targetMax,
            'deviation' => $deviation,
        ]);
    }
}
