<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Illuminate\Support\Facades\File;

class BackupController extends Controller
{
    public function export()
    {
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.zip';
        $zipPath = $backupDir . '/' . $filename;

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
            // 1. Export Database to JSON
            $tables = ['users', 'announcements', 'activities', 'transactions', 'homework', 'attendance', 'activity_student'];
            $data = [];
            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    $data[$table] = DB::table($table)->get()->toArray();
                }
            }
            $zip->addFromString('database.json', json_encode($data));

            // 2. Export Media Files
            $publicPath = storage_path('app/public');
            if (File::exists($publicPath)) {
                $files = File::allFiles($publicPath);
                foreach ($files as $file) {
                    $relativePath = 'media/' . $file->getRelativePathname();
                    $zip->addFile($file->getRealPath(), $relativePath);
                }
            }

            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:zip',
        ]);

        $file = $request->file('backup_file');
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) === TRUE) {
            $extractPath = storage_path('app/temp_import');
            if (File::exists($extractPath)) {
                File::deleteDirectory($extractPath);
            }
            File::makeDirectory($extractPath);
            $zip->extractTo($extractPath);
            $zip->close();

            // 1. Restore Database
            $dbJsonPath = $extractPath . '/database.json';
            if (File::exists($dbJsonPath)) {
                $data = json_decode(File::get($dbJsonPath), true);

                // Disable foreign key checks for clean restore
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                foreach ($data as $table => $rows) {
                    if (Schema::hasTable($table)) {
                        DB::table($table)->truncate();
                        foreach ($rows as $row) {
                            DB::table($table)->insert((array)$row);
                        }
                    }
                }

                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }

            // 2. Restore Media
            $mediaPath = $extractPath . '/media';
            if (File::exists($mediaPath)) {
                $publicPath = storage_path('app/public');
                File::copyDirectory($mediaPath, $publicPath);
            }

            File::deleteDirectory($extractPath);

            return response()->json(['message' => 'Backup restored successfully!']);
        }

        return response()->json(['message' => 'Failed to open backup file.'], 400);
    }
}
