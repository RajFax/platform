<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Controller extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_id',
        'name',
        'type',
        'level',
        'mode',
        'status',
        'last_communication_at',
        'metadata',
    ];

    protected $casts = [
        'last_communication_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function actions()
    {
        return $this->hasMany(Action::class);
    }
}
