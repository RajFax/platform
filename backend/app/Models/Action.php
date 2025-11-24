<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Action extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_id',
        'controller_id',
        'type',
        'source',
        'started_at',
        'ended_at',
        'parameters',
        'result_status',
        'message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'parameters' => 'array',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function controller()
    {
        return $this->belongsTo(Controller::class);
    }
}
