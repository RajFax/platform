<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sensor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SensorController extends Controller
{
    private const SENSOR_TYPES = [
        'soil_moisture',
        'temperature_air',
        'humidity_air',
        'ec_soil',
        'ph_soil',
        'co2',
        'light',
        'pressure',
        'rainfall',
    ];

    private const SENSOR_UNITS = [
        '%',
        '°C',
        'dS/m',
        'pH',
        'ppm',
        'lux',
        'hPa',
        'mm',
    ];

    // GET /api/sensors?zone_id=...
    public function index(Request $request)
    {
        $query = Sensor::query()->with('zone.parcel.farm');

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->integer('zone_id'));
        }

        $sensors = $query
            ->orderBy('id')
            ->get()
            ->map(function (Sensor $s) {
                $zone = $s->zone;
                $parcel = $zone?->parcel;
                $farm = $parcel?->farm;

                return [
                    'id' => $s->id,
                    'zone_id' => $s->zone_id,
                    'name' => $s->name,
                    'type' => $s->type,
                    'unit' => $s->unit,
                    'hardware_id' => $s->hardware_id,
                    'position' => $s->position,
                    'is_active' => $s->is_active,
                    'zone' => $zone ? ['id' => $zone->id, 'name' => $zone->name] : null,
                    'parcel' => $parcel ? ['id' => $parcel->id, 'name' => $parcel->name] : null,
                    'farm' => $farm ? ['id' => $farm->id, 'name' => $farm->name] : null,
                ];
            });

        return response()->json($sensors);
    }

    // GET /api/sensors/{id}
    public function show(Sensor $sensor)
    {
        $sensor->load('zone.parcel.farm');

        return response()->json($sensor);
    }

    // POST /api/sensors
    public function store(Request $request)
    {
        $data = $request->validate([
            'zone_id' => ['required', 'exists:zones,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255', Rule::in(self::SENSOR_TYPES)],
            'unit' => ['required', 'string', 'max:32', Rule::in(self::SENSOR_UNITS)],
            'hardware_id' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        $sensor = Sensor::create($data);

        return response()->json($sensor, 201);
    }

    // PUT /api/sensors/{id}
    public function update(Request $request, Sensor $sensor)
    {
        $data = $request->validate([
            'zone_id' => ['sometimes', 'required', 'exists:zones,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'max:255', Rule::in(self::SENSOR_TYPES)],
            'unit' => ['sometimes', 'required', 'string', 'max:32', Rule::in(self::SENSOR_UNITS)],
            'hardware_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'position' => ['sometimes', 'nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (!array_key_exists('zone_id', $data)) {
            $data['zone_id'] = $sensor->zone_id;
        }

        $sensor->update($data);
        $sensor->load('zone.parcel.farm');

        return response()->json($sensor);
    }

    // DELETE /api/sensors/{id}
    public function destroy(Sensor $sensor)
    {
        $sensor->delete();

        return response()->json(['message' => 'Sensor deleted'], 204);
    }
}
