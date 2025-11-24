<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Farm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'surface_ha',
        'description',
    ];

    public function blocks()
    {
        return $this->hasMany(Block::class);
    }

    public function parcels()
    {
        return $this->hasMany(Parcel::class);
    }

    public function weatherStations()
    {
        return $this->hasMany(WeatherStation::class);
    }
}
