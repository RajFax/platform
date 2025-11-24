<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Parcel extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'block_id',
        'name',
        'surface_ha',
        'description',
        'culture_type',
        'variety',
        'crop_stage',
        'planting_date',
        'target_soil_moisture_min',
        'target_soil_moisture_max',
        'target_temp_min',
        'target_temp_max',
    ];

    protected $casts = [
        'planting_date' => 'date',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function block()
    {
        return $this->belongsTo(Block::class);
    }

    public function zones()
    {
        return $this->hasMany(Zone::class);
    }
}
