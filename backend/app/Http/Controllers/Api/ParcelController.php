<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parcel;
use Illuminate\Http\Request;

class ParcelController extends Controller
{
    // GET /api/parcels?farm_id=...
    public function index(Request $request)
    {
        $query = Parcel::query()->with(['farm', 'block', 'zones']);

        if ($request->filled('farm_id')) {
            $query->where('farm_id', $request->integer('farm_id'));
        }

        $parcels = $query->orderBy('id')->get();

        return response()->json($parcels);
    }

    // GET /api/parcels/{id}
    public function show(Parcel $parcel)
    {
        $parcel->load(['farm', 'block', 'zones']);

        return response()->json($parcel);
    }

    // POST /api/parcels
    public function store(Request $request)
    {
        $data = $request->validate([
            'farm_id'       => ['required', 'exists:farms,id'],
            'block_id'      => ['nullable', 'exists:blocks,id'],
            'name'          => ['required', 'string', 'max:255'],
            'surface_ha'    => ['nullable', 'numeric', 'min:0'],
            'description'   => ['nullable', 'string'],
            'culture_type'  => ['required', 'string', 'max:255'],
            'variety'       => ['nullable', 'string', 'max:255'],
            'crop_stage'    => ['required', 'string', 'max:255'],

            'planting_date' => ['nullable', 'date'],
            'target_soil_moisture_min' => ['nullable', 'numeric'],
            'target_soil_moisture_max' => ['nullable', 'numeric'],
            'target_temp_min' => ['nullable', 'numeric'],
            'target_temp_max' => ['nullable', 'numeric'],
        ]);

        $parcel = Parcel::create($data);

        return response()->json($parcel, 201);
    }

    // PUT /api/parcels/{id}
    public function update(Request $request, Parcel $parcel)
    {
        $data = $request->validate([
            'farm_id'       => ['sometimes', 'required', 'exists:farms,id'],
            'block_id'      => ['sometimes', 'nullable', 'exists:blocks,id'],
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'surface_ha'    => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'culture_type'  => ['sometimes', 'required', 'string', 'max:255'],
            'variety'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'crop_stage'    => ['sometimes', 'required', 'string', 'max:255'],

            'planting_date' => ['sometimes', 'nullable', 'date'],
            'target_soil_moisture_min' => ['sometimes', 'nullable', 'numeric'],
            'target_soil_moisture_max' => ['sometimes', 'nullable', 'numeric'],
            'target_temp_min' => ['sometimes', 'nullable', 'numeric'],
            'target_temp_max' => ['sometimes', 'nullable', 'numeric'],
        ]);

        $parcel->update($data);

        return response()->json($parcel);
    }

    // DELETE /api/parcels/{id}
    public function destroy(Parcel $parcel)
    {
        $parcel->delete();

        return response()->json(['message' => 'Parcel deleted'], 204);
    }
}
