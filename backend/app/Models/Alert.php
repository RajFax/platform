<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_id',
        'sensor_id',
        'controller_id',
        'type',
        'severity',
        'message',
        'raised_at',
        'cleared_at',
        'status',
    ];

    protected $casts = [
        'raised_at' => 'datetime',
        'cleared_at' => 'datetime',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function sensor()
    {
        return $this->belongsTo(Sensor::class);
    }

    public function controller()
    {
        return $this->belongsTo(Controller::class);
    }
}
