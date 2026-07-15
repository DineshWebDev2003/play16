<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Homework extends Model
{
    protected $table = 'homework';
    protected $fillable = ['title', 'description', 'subject', 'class_name', 'due_date', 'teacher_id'];
}
