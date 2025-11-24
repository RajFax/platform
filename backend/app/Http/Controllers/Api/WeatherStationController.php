<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WeatherStation;
use Illuminate\Http\Request;

class WeatherStationController extends Controller
{
    // GET /api/weather-stations
    public function index()
    {
        $stations = WeatherStation::with('farm')
            ->orderBy('id')
            ->get()
            ->map(function (WeatherStation $s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'location_type' => $s->location_type,
                    'status' => $s->status,
                    'position' => $s->position,
                    'farm' => $s->farm ? [
                        'id' => $s->farm->id,
                        'name' => $s->farm->name,
                    ] : null,
                ];
            });

        return response()->json($stations);
    }

    // GET /api/weather-stations/{id}
    public function show(WeatherStation $weatherStation)
    {
        $weatherStation->load('farm');

        $measurements = $weatherStation->measurements()
            ->orderByDesc('measured_at')
            ->limit(48)
            ->get();

        return response()->json([
            'station' => $weatherStation,
            'measurements' => $measurements,
        ]);
    }

    // POST /api/weather-stations
    public function store(Request $request)
    {
        $data = $request->validate([
            'farm_id'       => ['nullable', 'exists:farms,id'],
            'name'          => ['required', 'string', 'max:255'],
            'location_type' => ['nullable', 'string', 'max:255'],
            'status'        => ['nullable', 'string', 'max:32'],
            'position'      => ['nullable', 'array'],
        ]);

        if (! isset($data['status'])) {
            $data['status'] = 'OFFLINE';
        }

        $station = WeatherStation::create($data);
        $station->load('farm');

        return response()->json($station, 201);
    }

    // PUT /api/weather-stations/{id}
    public function update(Request $request, WeatherStation $weatherStation)
    {
        $data = $request->validate([
            'farm_id'       => ['sometimes', 'nullable', 'exists:farms,id'],
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'location_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status'        => ['sometimes', 'nullable', 'string', 'max:32'],
            'position'      => ['sometimes', 'nullable', 'array'],
        ]);

        $weatherStation->update($data);
        $weatherStation->load('farm');

        return response()->json($weatherStation);
    }

    // DELETE /api/weather-stations/{id}
    public function destroy(WeatherStation $weatherStation)
    {
        $weatherStation->delete();

        return response()->json(['message' => 'Weather station deleted'], 204);
    }
}
