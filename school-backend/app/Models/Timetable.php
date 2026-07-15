<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Timetable extends Model
{
    protected $fillable = ['day', 'time', 'activity', 'room', 'icon', 'color'];
}
