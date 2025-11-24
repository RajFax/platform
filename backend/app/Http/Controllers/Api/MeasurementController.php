<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Measurement;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MeasurementController extends Controller
{
    // GET /api/measurements?sensor_id=...&limit=50
    public function index(Request $request)
    {
        $query = Measurement::query()->with('sensor.zone');

        if ($request->filled('sensor_id')) {
            $query->where('sensor_id', $request->integer('sensor_id'));
        }

        $limit = $request->integer('limit', 100);
        $limit = max(1, min($limit, 500));

        $measurements = $query
            ->orderByDesc('measured_at')
            ->limit($limit)
            ->get();

        return response()->json($measurements);
    }

    // POST /api/measurements
    public function store(Request $request)
    {
        $data = $request->validate([
            'sensor_id' => ['required', 'exists:sensors,id'],
            'measured_at' => ['nullable', 'date'],
            'value' => ['required', 'numeric'],
            'raw_value' => ['nullable'],
            'quality_flag' => ['nullable', 'string', 'max:32'],
        ]);

        if (empty($data['measured_at'])) {
            $data['measured_at'] = Carbon::now();
        }

        if (empty($data['quality_flag'])) {
            $data['quality_flag'] = 'OK';
        }

        $measurement = Measurement::create($data);

        return response()->json($measurement, 201);
    }
}
