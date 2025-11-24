<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class WeatherMeasurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'weather_station_id',
        'measured_at',
        'air_temperature',
        'relative_humidity',
        'wind_speed',
        'solar_radiation',
        'rainfall',
        'et0',
        'metadata',
    ];

    protected $casts = [
        'measured_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function station()
    {
        return $this->belongsTo(WeatherStation::class, 'weather_station_id');
    }
}
