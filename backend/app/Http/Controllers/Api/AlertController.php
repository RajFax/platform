<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    // GET /api/alerts
    public function index(Request $request)
    {
        $query = Alert::query()
            ->with(['zone.parcel.farm', 'sensor', 'controller'])
            ->orderByDesc('raised_at');

        if ($request->filled('severity')) {
            $query->where('severity', $request->string('severity'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $alerts = $query
            ->limit(100)
            ->get()
            ->map(fn (Alert $alert) => $this->transformAlert($alert));

        return response()->json($alerts);
    }

    // GET /api/alerts/{alert}
    public function show(Alert $alert)
    {
        $alert->load(['zone.parcel.farm', 'sensor', 'controller']);

        return response()->json($this->transformAlert($alert));
    }

    // POST /api/alerts
    public function store(Request $request)
    {
        $data = $request->validate([
            'zone_id'       => ['nullable', 'exists:zones,id'],
            'sensor_id'     => ['nullable', 'exists:sensors,id'],
            'controller_id' => ['nullable', 'exists:controllers,id'],

            'type'          => ['required', 'string', 'max:255'],
            'severity'      => ['required', 'string', 'max:32'],
            'message'       => ['required', 'string'],

            'raised_at'     => ['nullable', 'date'],
            'cleared_at'    => ['nullable', 'date'],
            'status'        => ['nullable', 'string', 'max:32'],
        ]);

        if (! isset($data['raised_at'])) {
            $data['raised_at'] = now();
        }

        if (! isset($data['status'])) {
            $data['status'] = 'OPEN';
        }

        $alert = Alert::create($data);
        $alert->load(['zone.parcel.farm', 'sensor', 'controller']);

        return response()->json($this->transformAlert($alert), 201);
    }

    // PUT /api/alerts/{alert}
    public function update(Request $request, Alert $alert)
    {
        $data = $request->validate([
            'zone_id'       => ['sometimes', 'nullable', 'exists:zones,id'],
            'sensor_id'     => ['sometimes', 'nullable', 'exists:sensors,id'],
            'controller_id' => ['sometimes', 'nullable', 'exists:controllers,id'],

            'type'          => ['sometimes', 'string', 'max:255'],
            'severity'      => ['sometimes', 'string', 'max:32'],
            'message'       => ['sometimes', 'string'],

            'raised_at'     => ['sometimes', 'nullable', 'date'],
            'cleared_at'    => ['sometimes', 'nullable', 'date'],
            'status'        => ['sometimes', 'string', 'max:32'],
        ]);

        $alert->update($data);
        $alert->load(['zone.parcel.farm', 'sensor', 'controller']);

        return response()->json($this->transformAlert($alert));
    }

    // DELETE /api/alerts/{alert}
    public function destroy(Alert $alert)
    {
        $alert->delete();

        return response()->json(['message' => 'Alert deleted'], 204);
    }

    /**
     * Formate l’alerte pour l’API.
     */
    protected function transformAlert(Alert $alert): array
    {
        $zone   = $alert->zone;
        $parcel = $zone?->parcel;
        $farm   = $parcel?->farm;

        return [
            'id'         => $alert->id,
            'type'       => $alert->type,
            'severity'   => $alert->severity,
            'message'    => $alert->message,
            'status'     => $alert->status,
            'raised_at'  => $alert->raised_at,
            'cleared_at' => $alert->cleared_at,

            'zone' => $zone ? [
                'id'   => $zone->id,
                'name' => $zone->name,
            ] : null,

            'parcel' => $parcel ? [
                'id'   => $parcel->id,
                'name' => $parcel->name,
            ] : null,

            'farm' => $farm ? [
                'id'   => $farm->id,
                'name' => $farm->name,
            ] : null,

            'sensor' => $alert->sensor ? [
                'id'   => $alert->sensor->id,
                'name' => $alert->sensor->name,
            ] : null,

            'controller' => $alert->controller ? [
                'id'   => $alert->controller->id,
                'name' => $alert->controller->name,
            ] : null,
        ];
    }
}
