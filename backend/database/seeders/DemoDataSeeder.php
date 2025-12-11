<?php

namespace Database\Seeders;

use App\Models\Farm;
use App\Models\Block;
use App\Models\Parcel;
use App\Models\Zone;
use App\Models\Sensor;
use App\Models\Measurement;
use App\Models\Controller;
use App\Models\WeatherStation;
use App\Models\WeatherMeasurement;
use App\Models\Action;
use App\Models\Alert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $farm = Farm::create([
            'name' => 'Exploitation Demo',
            'location' => 'Site principal',
            'surface_ha' => 5.2,
            'description' => 'Ferme de démonstration pour la plateforme.',
        ]);

        $block = Block::create([
            'farm_id' => $farm->id,
            'name' => 'Bloc principal',
            'type' => 'openfield',
            'description' => 'Bloc de démonstration',
        ]);

        $parcel = Parcel::create([
            'farm_id' => $farm->id,
            'block_id' => $block->id,
            'name' => 'Parcelle Tomates Nord',
            'surface_ha' => 1.2,
            'description' => 'Tomates sous serre',
            'culture_type' => 'Tomate',
            'variety' => 'Tomate variété X',
            'crop_stage' => 'FLOWERING',
            'planting_date' => Carbon::now()->subDays(45),
            'target_soil_moisture_min' => 30,
            'target_soil_moisture_max' => 40,
            'target_temp_min' => 18,
            'target_temp_max' => 26,
        ]);

        $zone = Zone::create([
            'parcel_id' => $parcel->id,
            'name' => 'Zone 1',
            'description' => 'Zone d’irrigation principale',
            'surface_ha' => 0.6,
            'is_active' => true,
            'irrigation_strategy_type' => 'FUZZY',
            'irrigation_strategy_params' => [
                'type' => 'IRRIGATION_FUZZY',
                'inputs' => ['soil_deficit', 'et0', 'crop_stage'],
            ],
            'fertilization_strategy_type' => 'DOSE_PER_IRRIGATION',
            'fertilization_strategy_params' => [
                'concentration_g_l' => 1.5,
            ],
        ]);

        $controller = Controller::create([
            'zone_id' => $zone->id,
            'name' => 'CTRL-Z1-VALVE-01',
            'type' => 'VALVE',
            'level' => 'ZONE',
            'mode' => 'AUTO_FUZZY',
            'status' => 'ONLINE',
            'last_communication_at' => Carbon::now()->subMinutes(5),
            'metadata' => [
                'max_flow_l_h' => 800,
            ],
        ]);

        $sensor1 = Sensor::create([
            'zone_id' => $zone->id,
            'name' => 'Capteur Sol 1',
            'type' => 'SOIL_MOISTURE',
            'unit' => '%',
            'hardware_id' => 'S1',
            'position' => ['x' => 1, 'y' => 1],
            'is_active' => true,
        ]);

        $sensor2 = Sensor::create([
            'zone_id' => $zone->id,
            'name' => 'Capteur Sol 2',
            'type' => 'SOIL_MOISTURE',
            'unit' => '%',
            'hardware_id' => 'S2',
            'position' => ['x' => 2, 'y' => 1],
            'is_active' => true,
        ]);

        // Mesures sur 12 points de temps
        $now = Carbon::now()->subHours(6);
        for ($i = 0; $i < 12; $i++) {
            Measurement::create([
                'sensor_id' => $sensor1->id,
                'measured_at' => (clone $now)->addMinutes($i * 30),
                'value' => 28 + ($i % 4), // valeurs autour de 30
                'raw_value' => null,
                'quality_flag' => 'OK',
            ]);

            Measurement::create([
                'sensor_id' => $sensor2->id,
                'measured_at' => (clone $now)->addMinutes($i * 30),
                'value' => 32 + ($i % 3),
                'raw_value' => null,
                'quality_flag' => 'OK',
            ]);
        }

        $station = WeatherStation::create([
            'farm_id' => $farm->id,
            'name' => 'Station Météo Principale',
            'location_type' => 'GREENHOUSE',
            'latitude' => null,
            'longitude' => null,
            'elevation_m' => null,
            'status' => 'ONLINE',
        ]);

        for ($i = 0; $i < 6; $i++) {
            WeatherMeasurement::create([
                'weather_station_id' => $station->id,
                'measured_at' => Carbon::now()->subHours($i),
                'air_temperature' => 22 + $i * 0.5,
                'relative_humidity' => 60 + $i,
                'wind_speed' => 0.0,
                'solar_radiation' => 300 + $i * 20,
                'rainfall' => 0.0,
                'et0' => 3 + $i * 0.1,
                'metadata' => [],
            ]);
        }

        // 🔹 Actions de démonstration
        $start = Carbon::now()->subHours(3);

        Action::create([
            'zone_id' => $zone->id,
            'controller_id' => $controller->id,
            'type' => 'IRRIGATION',
            'source' => 'AUTO_STRATEGY',
            'started_at' => $start->copy(),
            'ended_at' => $start->copy()->addMinutes(20),
            'parameters' => [
                'duration_min' => 20,
                'volume_l' => 200,
            ],
            'result_status' => 'SUCCESS',
            'message' => 'Cycle d’irrigation terminé normalement.',
        ]);

        Action::create([
            'zone_id' => $zone->id,
            'controller_id' => $controller->id,
            'type' => 'IRRIGATION',
            'source' => 'AUTO_STRATEGY',
            'started_at' => $start->copy()->addHour(),
            'ended_at' => $start->copy()->addHour()->addMinutes(15),
            'parameters' => [
                'duration_min' => 15,
                'volume_l' => 150,
            ],
            'result_status' => 'SUCCESS',
            'message' => 'Irrigation réduite (sol déjà proche de la consigne).',
        ]);

        Action::create([
            'zone_id' => $zone->id,
            'controller_id' => $controller->id,
            'type' => 'FERTIGATION',
            'source' => 'AUTO_STRATEGY',
            'started_at' => $start->copy()->addHours(2),
            'ended_at' => $start->copy()->addHours(2)->addMinutes(10),
            'parameters' => [
                'duration_min' => 10,
                'fertilizer_conc_g_l' => 1.5,
            ],
            'result_status' => 'SUCCESS',
            'message' => 'Apport nutritif selon la stratégie dose par irrigation.',
        ]);

        // 🔹 Alertes de démonstration
        Alert::create([
            'zone_id' => $zone->id,
            'sensor_id' => $sensor1->id,
            'controller_id' => $controller->id,
            'type' => 'SOIL_DRY',
            'severity' => 'WARNING',
            'message' => 'Humidité du sol sous la consigne minimale.',
            'raised_at' => Carbon::now()->subMinutes(30),
            'cleared_at' => null,
            'status' => 'OPEN',
        ]);

        Alert::create([
            'zone_id' => $zone->id,
            'sensor_id' => $sensor2->id,
            'controller_id' => null,
            'type' => 'SOIL_WET',
            'severity' => 'INFO',
            'message' => 'Humidité légèrement au-dessus de la consigne.',
            'raised_at' => Carbon::now()->subHours(2),
            'cleared_at' => Carbon::now()->subHour(),
            'status' => 'CLOSED',
        ]);
    }
}
