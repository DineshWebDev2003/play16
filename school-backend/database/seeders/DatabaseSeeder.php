<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Announcement;
use App\Models\Activity;
use App\Models\Transaction;
use App\Models\Homework;
use App\Models\Attendance;
use App\Models\Branch;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Create a default branch
        $mainBranch = Branch::create([
            'name' => 'TN HAPPYKIDS - Main Branch',
            'address' => 'Tamil Nadu',
        ]);

        // 1. Master Admin
        User::create([
            'name' => 'Master Admin',
            'username' => 'master_admin',
            'email' => 'master@tnhappykids.com',
            'password' => Hash::make('password'),
            'role' => 'master_admin',
            'status' => 'active',
        ]);

        // 2. Branch Admin
        User::create([
            'name' => 'School Admin',
            'username' => 'admin',
            'email' => 'admin@school.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'branch_id' => $mainBranch->id,
            'status' => 'active',
        ]);

        // 3. Teachers
        User::create([
            'name' => 'Ms. Sarah Johnson',
            'username' => 'sarah',
            'email' => 'sarah@teacher.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'teacher_id' => 'TCH001',
            'category' => 'Primary Head',
            'branch_id' => $mainBranch->id,
            'status' => 'active',
        ]);

        // 5. Students
        $student1 = User::create([
            'name' => 'Arjun Kumar',
            'username' => 'arjun',
            'email' => 'arjun@student.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'student_id' => 'STU2024001',
            'father_name' => 'Ravi Kumar',
            'blood_group' => 'O+',
            'category' => 'Kindergarten A',
            'fees' => '50000',
            'branch_id' => $mainBranch->id,
            'status' => 'active',
        ]);

        User::create([
            'name' => 'Meera Reddy',
            'username' => 'meera',
            'email' => 'meera@student.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'student_id' => 'STU2024002',
            'father_name' => 'Suresh Reddy',
            'blood_group' => 'A+',
            'category' => 'Kindergarten A',
            'fees' => '50000',
            'branch_id' => $mainBranch->id,
            'status' => 'active',
        ]);

        // 6. Announcements
        Announcement::create([
            'title' => 'Annual Sports Day 🏆',
            'content' => 'Join us for our annual sports meet on Feb 25th. All parents are invited!',
            'date' => '2024-02-20',
            'target' => 'all',
            'author' => 'Principal',
        ]);

        // 7. Transactions
        Transaction::create(['name' => 'Monthly Fees - Grade A', 'category' => 'Fees', 'amount' => 150000, 'type' => 'income', 'date' => '2024-02-15']);
        Transaction::create(['name' => 'School Maintenance', 'category' => 'Repair', 'amount' => 25000, 'type' => 'expense', 'date' => '2024-02-14']);

        // 8. Activities
        $activity = Activity::create([
            'title' => 'Drawing Competition 🎨',
            'description' => 'Students enjoyed the creative drawing session today.',
            'media_type' => 'image',
            'media_url' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            'date' => '2024-02-18',
            'author' => 'Ms. Sarah',
        ]);
        $activity->students()->attach($student1->id);

        // 9. Homework
        Homework::create([
            'title' => 'Math: Table of 5',
            'description' => 'Recite and write table of 5 three times.',
            'subject' => 'Mathematics',
            'class_name' => 'Grade 1',
            'due_date' => '2024-02-20',
            'teacher_id' => 1,
        ]);

        // 10. Attendance
        Attendance::create([
            'student_id' => $student1->id,
            'date' => date('Y-m-d'),
            'status' => 'present',
        ]);
    }
}
