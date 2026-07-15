<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CameraSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cameras = [
            [
                'name' => 'Sleeping Area',
                'device_id' => 'D54F5AGPGV0AC63',
                'proxy_path' => 'sleeping_area',
                'url' => 'https://app.chithodehappykids.com/cameras/sleeping_area',
                'status' => 'online',
            ],
            [
                'name' => 'Study Area',
                'device_id' => 'F1A74AFPGV28447',
                'proxy_path' => 'study_area',
                'url' => 'https://app.chithodehappykids.com/cameras/study_area',
                'status' => 'online',
            ],
            [
                'name' => 'School Entrance',
                'device_id' => 'F1A74AFPGV2BA26',
                'proxy_path' => 'school_entrance',
                'url' => 'https://app.chithodehappykids.com/cameras/school_entrance',
                'status' => 'online',
            ],
        ];

        foreach ($cameras as $camera) {
            \App\Models\Camera::updateOrCreate(
                ['device_id' => $camera['device_id']],
                $camera
            );
        }
    }
}
