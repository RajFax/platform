<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Sensor extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_id',
        'name',
        'type',
        'unit',
        'hardware_id',
        'position',
        'is_active',
        'calibration_info',
    ];

    protected $casts = [
        'position' => 'array',
        'calibration_info' => 'array',
        'is_active' => 'boolean',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function measurements()
    {
        return $this->hasMany(Measurement::class);
    }
}
