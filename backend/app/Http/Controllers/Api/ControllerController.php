<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller as BaseController;
use App\Models\Controller;
use Illuminate\Http\Request;

class ControllerController extends BaseController
{
    // GET /api/controllers
    public function index()
    {
        $controllers = Controller::with(['zone.parcel.farm'])
            ->orderBy('id')
            ->get()
            ->map(fn (Controller $c) => $this->transformController($c));

        return response()->json($controllers);
    }

    // GET /api/controllers/{controller}
    public function show(Controller $controller)
    {
        $controller->load(['zone.parcel.farm']);

        return response()->json($this->transformController($controller));
    }

    // POST /api/controllers
    public function store(Request $request)
    {
        $data = $request->validate([
            'zone_id'               => ['required', 'exists:zones,id'],
            'name'                  => ['required', 'string', 'max:255'],
            'type'                  => ['required', 'string', 'max:255'],
            'level'                 => ['nullable', 'string', 'max:255'],
            'mode'                  => ['required', 'string', 'max:64'],
            'status'                => ['nullable', 'string', 'max:32'],
            'last_communication_at' => ['nullable', 'date'],
            'metadata'              => ['nullable', 'array'],
        ]);

        if (! isset($data['status'])) {
            $data['status'] = 'OFFLINE';
        }

        $controller = Controller::create($data);
        $controller->load(['zone.parcel.farm']);

        return response()->json($this->transformController($controller), 201);
    }

    // PUT /api/controllers/{controller}
    public function update(Request $request, Controller $controller)
    {
        $data = $request->validate([
            'zone_id'               => ['sometimes', 'required', 'exists:zones,id'],
            'name'                  => ['sometimes', 'required', 'string', 'max:255'],
            'type'                  => ['sometimes', 'required', 'string', 'max:255'],
            'level'                 => ['sometimes', 'nullable', 'string', 'max:255'],
            'mode'                  => ['sometimes', 'required', 'string', 'max:64'],
            'status'                => ['sometimes', 'nullable', 'string', 'max:32'],
            'last_communication_at' => ['sometimes', 'nullable', 'date'],
            'metadata'              => ['sometimes', 'nullable', 'array'],
        ]);

        $controller->update($data);
        $controller->load(['zone.parcel.farm']);

        return response()->json($this->transformController($controller));
    }

    // DELETE /api/controllers/{controller}
    public function destroy(Controller $controller)
    {
        $controller->delete();

        return response()->json(['message' => 'Controller deleted'], 204);
    }

    protected function transformController(Controller $c): array
    {
        $zone = $c->zone;
        $parcel = $zone?->parcel;
        $farm = $parcel?->farm;

        return [
            'id'                    => $c->id,
            'name'                  => $c->name,
            'type'                  => $c->type,
            'level'                 => $c->level,
            'mode'                  => $c->mode,
            'status'                => $c->status,
            'last_communication_at' => $c->last_communication_at,
            'zone'                  => $zone ? [
                'id'        => $zone->id,
                'name'      => $zone->name,
                'is_active' => $zone->is_active,
            ] : null,
            'parcel'                => $parcel ? [
                'id'   => $parcel->id,
                'name' => $parcel->name,
            ] : null,
            'farm'                  => $farm ? [
                'id'   => $farm->id,
                'name' => $farm->name,
            ] : null,
        ];
    }
}
