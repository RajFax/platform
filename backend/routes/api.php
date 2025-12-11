<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\ParcelController;
use App\Http\Controllers\Api\ZoneController;
use App\Http\Controllers\Api\SensorController;
use App\Http\Controllers\Api\MeasurementController;
use App\Http\Controllers\Api\ControllerController;
use App\Http\Controllers\Api\WeatherStationController;
use App\Http\Controllers\Api\StrategyController;
use App\Http\Controllers\Api\AlertController;

// -------------------------------
// DASHBOARD
// -------------------------------
Route::get('/dashboard/overview', [FarmController::class, 'overview']);

// -------------------------------
// FARMS
// -------------------------------
Route::get('/farms', [FarmController::class, 'index']);
Route::get('/farms/{farm}', [FarmController::class, 'show']);
Route::post('/farms', [FarmController::class, 'store']);
Route::put('/farms/{farm}', [FarmController::class, 'update']);
Route::delete('/farms/{farm}', [FarmController::class, 'destroy']);

// -------------------------------
// BLOCKS
// -------------------------------
Route::get('/blocks', [BlockController::class, 'index']);
Route::get('/blocks/{block}', [BlockController::class, 'show']);
Route::post('/blocks', [BlockController::class, 'store']);
Route::put('/blocks/{block}', [BlockController::class, 'update']);
Route::delete('/blocks/{block}', [BlockController::class, 'destroy']);

// -------------------------------
// PARCELS
// -------------------------------
Route::get('/parcels', [ParcelController::class, 'index']);
Route::get('/parcels/{parcel}', [ParcelController::class, 'show']);
Route::post('/parcels', [ParcelController::class, 'store']);
Route::put('/parcels/{parcel}', [ParcelController::class, 'update']);
Route::delete('/parcels/{parcel}', [ParcelController::class, 'destroy']);

// -------------------------------
// ZONES
// -------------------------------
Route::get('/zones', [ZoneController::class, 'index']);
Route::get('/zones/{zone}', [ZoneController::class, 'show']);
Route::post('/zones', [ZoneController::class, 'store']);
Route::put('/zones/{zone}', [ZoneController::class, 'update']);
Route::delete('/zones/{zone}', [ZoneController::class, 'destroy']);

// -------------------------------
// SENSORS
// -------------------------------
Route::get('/sensors', [SensorController::class, 'index']);
Route::get('/sensors/{sensor}', [SensorController::class, 'show']);
Route::post('/sensors', [SensorController::class, 'store']);
Route::put('/sensors/{sensor}', [SensorController::class, 'update']);
Route::delete('/sensors/{sensor}', [SensorController::class, 'destroy']);

// -------------------------------
// MEASUREMENTS
// -------------------------------
Route::get('/measurements', [MeasurementController::class, 'index']);
Route::post('/measurements', [MeasurementController::class, 'store']);

// -------------------------------
// CONTROLLERS
// -------------------------------
Route::get('controllers', [ControllerController::class, 'index']);
Route::get('controllers/{controller}', [ControllerController::class, 'show']);
Route::post('controllers', [ControllerController::class, 'store']);
Route::put('controllers/{controller}', [ControllerController::class, 'update']);
Route::delete('controllers/{controller}', [ControllerController::class, 'destroy']);

// -------------------------------
// WEATHER STATIONS
// -------------------------------
Route::get('weather-stations', [WeatherStationController::class, 'index']);
Route::get('weather-stations/{weatherStation}', [WeatherStationController::class, 'show']);
Route::post('weather-stations', [WeatherStationController::class, 'store']);
Route::put('weather-stations/{weatherStation}', [WeatherStationController::class, 'update']);
Route::delete('weather-stations/{weatherStation}', [WeatherStationController::class, 'destroy']);

// -------------------------------
// STRATEGIES
// -------------------------------
Route::get('/strategies', [StrategyController::class, 'overview']);

// -------------------------------
// ALERTS
// -------------------------------
Route::get('alerts', [AlertController::class, 'index']);
Route::get('alerts/{alert}', [AlertController::class, 'show']);
Route::post('alerts', [AlertController::class, 'store']);
Route::put('alerts/{alert}', [AlertController::class, 'update']);
Route::delete('alerts/{alert}', [AlertController::class, 'destroy']);
