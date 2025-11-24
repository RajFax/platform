<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class WeatherStation extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'name',
        'location_type',
        'latitude',
        'longitude',
        'elevation_m',
        'status',
        'metadata',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'elevation_m' => 'float',
        'metadata' => 'array',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function measurements()
    {
        return $this->hasMany(WeatherMeasurement::class);
    }
}
