<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;

class StrategyController extends Controller
{
    // GET /api/strategies
    public function overview()
    {
        $zones = Zone::with(['parcel.farm'])
            ->where(function ($q) {
                $q->whereNotNull('irrigation_strategy_type')
                  ->orWhereNotNull('fertilization_strategy_type');
            })
            ->get();

        $irrigation = [];
        $fertilization = [];

        foreach ($zones as $zone) {
            $farm = $zone->parcel?->farm;
            $parcel = $zone->parcel;

            $zoneInfo = [
                'id' => $zone->id,
                'name' => $zone->name,
                'parcel' => $parcel ? [
                    'id' => $parcel->id,
                    'name' => $parcel->name,
                ] : null,
                'farm' => $farm ? [
                    'id' => $farm->id,
                    'name' => $farm->name,
                ] : null,
            ];

            if ($zone->irrigation_strategy_type) {
                $type = $zone->irrigation_strategy_type;
                if (! isset($irrigation[$type])) {
                    $irrigation[$type] = [
                        'type' => $type,
                        'zones_count' => 0,
                        'example_zones' => [],
                    ];
                }
                $irrigation[$type]['zones_count']++;
                if (count($irrigation[$type]['example_zones']) < 5) {
                    $irrigation[$type]['example_zones'][] = $zoneInfo;
                }
            }

            if ($zone->fertilization_strategy_type) {
                $type = $zone->fertilization_strategy_type;
                if (! isset($fertilization[$type])) {
                    $fertilization[$type] = [
                        'type' => $type,
                        'zones_count' => 0,
                        'example_zones' => [],
                    ];
                }
                $fertilization[$type]['zones_count']++;
                if (count($fertilization[$type]['example_zones']) < 5) {
                    $fertilization[$type]['example_zones'][] = $zoneInfo;
                }
            }
        }

        return response()->json([
            'irrigation' => array_values($irrigation),
            'fertilization' => array_values($fertilization),
        ]);
    }
}
