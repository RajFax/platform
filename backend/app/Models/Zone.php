<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = [
        'parcel_id',
        'name',
        'description',
        'surface_ha',
        'is_active',
        'irrigation_strategy_type',
        'irrigation_strategy_params',
        'fertilization_strategy_type',
        'fertilization_strategy_params',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'irrigation_strategy_params' => 'array',
        'fertilization_strategy_params' => 'array',
    ];

    public function parcel()
    {
        return $this->belongsTo(Parcel::class);
    }

    public function sensors()
    {
        return $this->hasMany(Sensor::class);
    }

    public function controllers(): HasMany
    {
        return $this->hasMany(Controller::class);
    }

    public function controller()
    {
        return $this->hasOne(Controller::class);
    }

    public function actions()
    {
        return $this->hasMany(Action::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }
}
