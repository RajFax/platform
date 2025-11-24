<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    // GET /api/zones?farm_id=&parcel_id=
    public function index(Request $request)
    {
        $query = Zone::query()
            ->with(['parcel.farm'])
            ->orderBy('id');

        if ($request->filled('farm_id')) {
            $query->whereHas('parcel', function ($q) use ($request) {
                $q->where('farm_id', $request->integer('farm_id'));
            });
        }

        if ($request->filled('parcel_id')) {
            $query->where('parcel_id', $request->integer('parcel_id'));
        }

        $zones = $query->get()->map(function (Zone $zone) {
            $parcel = $zone->parcel;
            $farm = $parcel?->farm;

            return [
                'id' => $zone->id,
                'parcel_id' => $zone->parcel_id,
                'name' => $zone->name,
                'description' => $zone->description,
                'surface_ha' => $zone->surface_ha,
                'is_active' => $zone->is_active,
                'irrigation_strategy_type' => $zone->irrigation_strategy_type,
                'irrigation_strategy_params' => $zone->irrigation_strategy_params,
                'fertilization_strategy_type' => $zone->fertilization_strategy_type,
                'fertilization_strategy_params' => $zone->fertilization_strategy_params,
                'parcel' => $parcel ? [
                    'id' => $parcel->id,
                    'name' => $parcel->name,
                ] : null,
                'farm' => $farm ? [
                    'id' => $farm->id,
                    'name' => $farm->name,
                ] : null,
            ];
        });

        return response()->json($zones);
    }

    // GET /api/zones/{zone}
    public function show(Zone $zone)
    {
        $zone->load(['parcel.farm', 'sensors', 'controllers']);

        return response()->json($zone);
    }

    // POST /api/zones
    public function store(Request $request)
    {
        $data = $request->validate([
            'parcel_id' => ['required', 'exists:parcels,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'surface_ha' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],

            'irrigation_strategy_type' => ['nullable', 'string', 'max:255'],
            'irrigation_strategy_params' => ['nullable', 'array'],
            'fertilization_strategy_type' => ['nullable', 'string', 'max:255'],
            'fertilization_strategy_params' => ['nullable', 'array'],
        ]);

        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        $zone = Zone::create($data);
        $zone->load(['parcel.farm']);

        return response()->json($zone, 201);
    }

    // PUT /api/zones/{zone}
    public function update(Request $request, Zone $zone)
    {
        $data = $request->validate([
            'parcel_id' => ['sometimes', 'required', 'exists:parcels,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'surface_ha' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],

            'irrigation_strategy_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'irrigation_strategy_params' => ['sometimes', 'nullable', 'array'],
            'fertilization_strategy_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fertilization_strategy_params' => ['sometimes', 'nullable', 'array'],
        ]);

        $zone->update($data);
        $zone->refresh()->load(['parcel.farm']);

        return response()->json($zone);
    }

    // DELETE /api/zones/{zone}
    public function destroy(Zone $zone)
    {
        $zone->delete();

        return response()->json(['message' => 'Zone deleted'], 204);
    }
}
