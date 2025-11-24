<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Block extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'name',
        'description',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function parcels()
    {
        return $this->hasMany(Parcel::class);
    }
}
