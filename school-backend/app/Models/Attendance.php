<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'attendance';
    protected $fillable = ['student_id', 'date', 'status', 'in_time', 'out_time', 'dropped_by_type', 'picked_by_type', 'dropped_by_name', 'picked_by_name', 'user_role', 'remarks'];
}
