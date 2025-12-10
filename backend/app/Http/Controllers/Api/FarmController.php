<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\Parcel;
use App\Models\Zone;
use App\Models\Sensor;
use App\Models\Controller as IrrigationController;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    // GET /api/dashboard/overview
    public function overview()
{
    $farmsCount = Farm::count();
    $parcelsCount = Parcel::count();
    $zonesCount = Zone::count();
    $sensorsCount = Sensor::count();
    $controllersTotal = IrrigationController::count();

    $activeZones = Zone::where('is_active', true)->count();
    $inactiveZones = $zonesCount - $activeZones;

    $controllersOnline = IrrigationController::where('status', 'ONLINE')->count();
    $controllersError = IrrigationController::where('status', 'ERROR')->count();

    $alertsOpen = \App\Models\Alert::where('status', 'OPEN')->count();

    $recentAlerts = \App\Models\Alert::with(['zone.parcel.farm'])
        ->orderByDesc('raised_at')
        ->limit(5)
        ->get()
        ->map(function ($a) {
            $zone = $a->zone;
            $parcel = $zone?->parcel;
            $farm = $parcel?->farm;

            return [
                'id' => $a->id,
                'type' => $a->type,
                'severity' => $a->severity,
                'message' => $a->message,
                'status' => $a->status,
                'raised_at' => $a->raised_at,
                'zone' => $zone ? [
                    'id' => $zone->id,
                    'name' => $zone->name,
                ] : null,
                'farm' => $farm ? [
                    'id' => $farm->id,
                    'name' => $farm->name,
                ] : null,
            ];
        });

    return response()->json([
        'stats' => [
            'farms' => $farmsCount,
            'parcels' => $parcelsCount,
            'zones' => $zonesCount,
            'active_zones' => $activeZones,
            'inactive_zones' => $inactiveZones,
            'sensors' => $sensorsCount,
            'controllers' => $controllersTotal,
            'controllers_online' => $controllersOnline,
            'controllers_error' => $controllersError,
            'alerts_open' => $alertsOpen,
        ],
        'farms' => Farm::withCount(['parcels'])
            ->orderBy('id')
            ->take(5)
            ->get(),
        'recent_alerts' => $recentAlerts,
    ]);
}


    // GET /api/farms
    public function index()
    {
        $farms = Farm::withCount(['parcels'])
            ->with(['parcels' => function ($q) {
                $q->select('id', 'farm_id', 'name', 'culture_type', 'surface_ha');
            }, 'blocks' => function ($q) {
                $q->select('id', 'farm_id', 'name');
            }])
            ->orderBy('id')
            ->get();

        return response()->json($farms);
    }

    // GET /api/farms/{farm}
    public function show(Farm $farm)
    {
        $farm->load([
            'blocks' => function ($q) {
                $q->orderBy('name');
            },
            'parcels.zones' => function ($q) {
                $q->orderBy('name');
            },
            'parcels.block',
            'weatherStations',
        ]);

        return response()->json($farm);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'location'    => ['nullable', 'string', 'max:255'],
            'surface_ha'  => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $farm = Farm::create($data);

        return response()->json($farm, 201);
    }
public function update(Request $request, Farm $farm)
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'required', 'string', 'max:255'],
            'location'    => ['sometimes', 'nullable', 'string', 'max:255'],
            'surface_ha'  => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $farm->update($data);

        return response()->json($farm);
    }
    public function destroy(Farm $farm)
    {
        $farm->delete();

        return response()->json(['message' => 'Farm deleted'], 204);
    }
    
}
