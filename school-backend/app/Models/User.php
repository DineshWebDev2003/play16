<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function isMasterAdmin(): bool
    {
        return $this->role === 'master_admin';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'name',
        'username',
        'date_of_birth',
        'email',
        'password',
        'role',
        'phone',
        'gender',
        'student_id',
        'teacher_id',
        'parent_name',
        'mother_name',
        'mother_phone',
        'father_name',
        'father_phone',
        'guardian_phone',
        'blood_group',
        'address',
        'category',
        'avatar',
        'student_photo',
        'father_photo',
        'mother_photo',
        'guardian_photo',
        'fees',
        'admission_date',
        'status',
        'push_token',
        'fee_due_day',
        'notification_settings',
    ];

    public function activities()
    {
        return $this->belongsToMany(Activity::class, 'activity_student');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_settings' => 'array',
        ];
    }
}
