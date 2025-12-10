<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BlockController extends Controller
{
    // GET /api/blocks?farm_id=...
    public function index(Request $request)
    {
        $query = Block::query()
            ->with(['farm:id,name'])
            ->withCount('parcels')
            ->orderBy('id');

        if ($request->filled('farm_id')) {
            $query->where('farm_id', $request->integer('farm_id'));
        }

        return response()->json($query->get());
    }

    // GET /api/blocks/{block}
    public function show(Block $block)
    {
        $block->load(['farm', 'parcels']);

        return response()->json($block);
    }

    // POST /api/blocks
    public function store(Request $request)
    {
        $data = $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['openfield', 'greenhouse'])],
            'description' => ['nullable', 'string'],
        ]);

        $block = Block::create($data);

        return response()->json($block, 201);
    }

    // PUT /api/blocks/{block}
    public function update(Request $request, Block $block)
    {
        if ($request->filled('farm_id') && (int) $request->farm_id !== (int) $block->farm_id) {
            abort(422, 'Changing the farm of a block is not supported.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(['openfield', 'greenhouse'])],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $block->update($data);
        $block->load(['farm:id,name']);

        return response()->json($block);
    }

    // DELETE /api/blocks/{block}
    public function destroy(Block $block)
    {
        $block->delete();

        return response()->json(['message' => 'Block deleted'], 204);
    }
}
