<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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
        $request->merge([
            'name' => trim((string) $request->input('name', '')),
            'description' => $request->filled('description')
                ? Str::limit(trim((string) $request->input('description')), 255, '')
                : null,
        ]);

        $data = $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['openfield', 'greenhouse'])],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $block = Block::create($data);
        } catch (QueryException $e) {
            $sqlState = $e->getCode();
            Log::error('Failed to create block', [
                'sql_state' => $sqlState,
                'farm_id' => $data['farm_id'] ?? null,
                'message' => $e->getMessage(),
            ]);

            if ($sqlState === '22001') {
                return response()->json([
                    'message' => 'Description trop longue (255 caractères maximum).',
                ], 422);
            }

            if (in_array($sqlState, ['23000', '23503'])) {
                return response()->json([
                    'message' => "Impossible d'enregistrer le bloc : l'exploitation associée est introuvable ou a été supprimée.",
                ], 422);
            }

            if (in_array($sqlState, ['42S02', '42S22'])) {
                return response()->json([
                    'message' => "La base de données n'est pas à jour : vérifiez que les migrations ont bien été exécutées.",
                ], 500);
            }

            throw $e;
        }

        return response()->json($block, 201);
    }

    // PUT /api/blocks/{block}
    public function update(Request $request, Block $block)
    {
        if ($request->filled('farm_id') && (int) $request->farm_id !== (int) $block->farm_id) {
            abort(422, 'Changing the farm of a block is not supported.');
        }

        $request->merge([
            'name' => $request->has('name') ? trim((string) $request->input('name')) : $block->name,
            'description' => $request->has('description')
                ? ($request->filled('description')
                    ? Str::limit(trim((string) $request->input('description')), 255, '')
                    : null)
                : $block->description,
        ]);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(['openfield', 'greenhouse'])],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        try {
            $block->update($data);
        } catch (QueryException $e) {
            if ($e->getCode() === '22001') {
                return response()->json([
                    'message' => 'Description trop longue (255 caractères maximum).',
                ], 422);
            }

            throw $e;
        }
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
