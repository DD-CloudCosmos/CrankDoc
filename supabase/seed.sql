-- CrankDoc Seed Data
-- Pilot motorcycle data with generation splits and expanded specs

-- ============================================================
-- Motorcycles (10 rows: 4 CBR + 2 Sportster 883 + 2 Sportster 1200 + MT-07 + Ninja 400 + R1250GS)
-- ============================================================

-- Honda CBR600RR Gen 1 (2003-2004): Original
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Honda', 'CBR600RR', 2003, 2004, 'inline-4', 599, 'sport', NULL,
  'Gen 1 (2003-2004)', 'EFI (PGM-FI)', 170, 117, 66,
  18, 3.4, NULL,
  '0.16-0.19mm', '0.22-0.27mm', 'NGK IMR9C-9HES',
  '120/70ZR17', '180/55ZR17'
);

-- Honda CBR600RR Gen 2 (2005-2006): New frame, inverted forks, dual-stage FI
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Honda', 'CBR600RR', 2005, 2006, 'inline-4', 599, 'sport', NULL,
  'Gen 2 (2005-2006)', 'EFI (PGM-FI, dual-stage)', 155, 118, 66,
  18, 3.4, NULL,
  '0.16-0.19mm', '0.22-0.27mm', 'NGK IMR9C-9HES',
  '120/70ZR17', '180/55ZR17'
);

-- Honda CBR600RR Gen 3 (2007-2012): All-new engine, lighter, C-ABS option 2009+
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Honda', 'CBR600RR', 2007, 2012, 'inline-4', 599, 'sport', NULL,
  'Gen 3 (2007-2012)', 'EFI (PGM-FI)', 156, 118, 66,
  18.1, 3.4, NULL,
  '0.16-0.19mm', '0.22-0.27mm', 'NGK IMR9C-9HES',
  '120/70ZR17', '180/55ZR17'
);

-- Honda CBR600RR Gen 4 (2013-2024): Big Piston Fork, revised ECU, TC 2021+
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Honda', 'CBR600RR', 2013, 2024, 'inline-4', 599, 'sport', NULL,
  'Gen 4 (2013-2024)', 'EFI (PGM-FI)', 162, 118, 66,
  18.1, 3.4, NULL,
  '0.16-0.19mm', '0.22-0.27mm', 'NGK IMR9C-9HES',
  '120/70ZR17', '180/55ZR17'
);

-- Yamaha MT-07 (2014-present): Single generation
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Yamaha', 'MT-07', 2014, NULL, 'parallel-twin', 689, 'naked', NULL,
  NULL, 'EFI', 182, 73, 67,
  14, 1.7, NULL,
  '0.11-0.20mm', '0.21-0.30mm', 'NGK LMAR8A-9',
  '120/70ZR17', '180/55ZR17'
);

-- Harley-Davidson Sportster 883 Carbureted (1986-2006)
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Harley-Davidson', 'Sportster 883', 1986, 2006, 'v-twin', 883, 'cruiser', NULL,
  'Carbureted (1986-2006)', 'Keihin CV40 carburetor', 227, 53, 69,
  12.5, 2.8, NULL,
  '0.001-0.003in', '0.002-0.004in', 'Harley 6R12',
  'MH90-21', '150/80-16'
);

-- Harley-Davidson Sportster 883 EFI (2007-2022)
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Harley-Davidson', 'Sportster 883', 2007, 2022, 'v-twin', 883, 'cruiser', NULL,
  'EFI (2007-2022)', 'Electronic Sequential Port Fuel Injection', 256, 53, 69,
  12.5, 2.8, NULL,
  '0.001-0.003in', '0.002-0.004in', 'Harley 6R12',
  'MH90-21', '150/80-16'
);

-- Harley-Davidson Sportster 1200 Carbureted (1988-2006)
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Harley-Davidson', 'Sportster 1200', 1988, 2006, 'v-twin', 1202, 'cruiser', NULL,
  'Carbureted (1988-2006)', 'Keihin CV40 carburetor', 230, 67, 84,
  12.5, 2.8, NULL,
  '0.001-0.003in', '0.002-0.004in', 'Harley 6R12',
  'MH90-21', '150/80-16'
);

-- Harley-Davidson Sportster 1200 EFI (2007-2022)
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Harley-Davidson', 'Sportster 1200', 2007, 2022, 'v-twin', 1202, 'cruiser', NULL,
  'EFI (2007-2022)', 'Electronic Sequential Port Fuel Injection', 256, 67, 84,
  12.5, 2.8, NULL,
  '0.001-0.003in', '0.002-0.004in', 'Harley 6R12',
  'MH90-21', '150/80-16'
);

-- Kawasaki Ninja 400 (2018-present): Single generation
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'Kawasaki', 'Ninja 400', 2018, NULL, 'parallel-twin', 399, 'sport', NULL,
  NULL, 'EFI', 168, 49, 38,
  14, 2.3, 2.0,
  '0.13-0.17mm', '0.20-0.24mm', 'NGK LMAR9G',
  '110/70R17', '150/60R17'
);

-- BMW R1250GS (2019-present): Single generation (ShiftCam)
INSERT INTO motorcycles (
  make, model, year_start, year_end, engine_type, displacement_cc, category, image_url,
  generation, fuel_system, dry_weight_kg, horsepower, torque_nm,
  fuel_capacity_liters, oil_capacity_liters, coolant_capacity_liters,
  valve_clearance_intake, valve_clearance_exhaust, spark_plug,
  tire_front, tire_rear
) VALUES (
  'BMW', 'R1250GS', 2019, NULL, 'boxer-twin', 1254, 'adventure', NULL,
  NULL, 'EFI (ShiftCam)', 249, 136, 143,
  20, 4.0, 1.5,
  '0.15-0.20mm', '0.30-0.35mm', 'NGK LMAR8BI-9',
  '120/70R19', '170/60R17'
);

-- ============================================================
-- DTC Codes
-- ============================================================

INSERT INTO dtc_codes (code, description, category, common_causes) VALUES
  (
    'P0301',
    'Cylinder 1 Misfire Detected',
    'powertrain',
    ARRAY['Faulty spark plug', 'Ignition coil failure', 'Fuel injector clogged', 'Low compression']
  ),
  (
    'P0302',
    'Cylinder 2 Misfire Detected',
    'powertrain',
    ARRAY['Faulty spark plug', 'Ignition coil failure', 'Fuel injector clogged', 'Low compression']
  ),
  (
    'P0116',
    'Engine Coolant Temperature Sensor Circuit Range/Performance',
    'powertrain',
    ARRAY['Faulty coolant temperature sensor', 'Wiring issues', 'Low coolant level', 'Thermostat stuck']
  ),
  (
    'P0122',
    'Throttle Position Sensor Circuit Low Input',
    'powertrain',
    ARRAY['Faulty TPS', 'Wiring short to ground', 'ECU malfunction', 'Poor connection']
  ),
  (
    'P0562',
    'System Voltage Low',
    'powertrain',
    ARRAY['Weak battery', 'Faulty alternator', 'Loose battery connections', 'Bad voltage regulator']
  ),
  (
    'C1234',
    'ABS Wheel Speed Sensor Front Left',
    'chassis',
    ARRAY['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues', 'Debris on sensor']
  ),
  (
    'C1235',
    'ABS Wheel Speed Sensor Front Right',
    'chassis',
    ARRAY['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues', 'Debris on sensor']
  );

-- ============================================================
-- Sample Diagnostic Trees
-- ============================================================

-- Insert sample diagnostic tree (Engine Won't Start for Honda CBR600RR)
-- Uses LIMIT 1 since there are now multiple CBR600RR generations
INSERT INTO diagnostic_trees (motorcycle_id, title, description, category, difficulty, tree_data)
SELECT
  id,
  'Engine Won''t Start',
  'Systematic diagnosis for a non-starting engine. Covers fuel, ignition, and mechanical issues.',
  'electrical',
  'beginner',
  '{
    "nodes": [
      {
        "id": "start",
        "type": "question",
        "text": "Does the engine turn over when you press the starter?",
        "safety": "green",
        "options": [
          {"text": "Yes, it cranks but won''t fire", "next": "cranks"},
          {"text": "No, nothing happens", "next": "no_crank"},
          {"text": "Clicks but doesn''t crank", "next": "click"}
        ]
      },
      {
        "id": "cranks",
        "type": "question",
        "text": "Do you smell fuel?",
        "safety": "yellow",
        "warning": "Fuel can be dangerous. Work in a well-ventilated area.",
        "options": [
          {"text": "Yes, strong fuel smell", "next": "flooded"},
          {"text": "No fuel smell", "next": "check_fuel"}
        ]
      },
      {
        "id": "no_crank",
        "type": "check",
        "text": "Check battery voltage with multimeter",
        "safety": "green",
        "instructions": "Set multimeter to DC voltage. Touch red probe to positive terminal, black to negative. Should read 12.4V or higher.",
        "next": "battery_result"
      },
      {
        "id": "click",
        "type": "solution",
        "text": "Likely Issue: Weak battery or bad starter relay",
        "safety": "green",
        "action": "Charge battery or replace starter relay",
        "details": "A clicking sound indicates the starter relay is engaging but not enough current to turn the engine. Try jump-starting or replacing the battery."
      },
      {
        "id": "flooded",
        "type": "solution",
        "text": "Engine is flooded",
        "safety": "green",
        "action": "Wait 15 minutes, then try starting with throttle wide open",
        "details": "Hold throttle fully open while cranking to allow excess fuel to clear."
      },
      {
        "id": "check_fuel",
        "type": "question",
        "text": "Can you hear the fuel pump prime when you turn the key on?",
        "safety": "green",
        "options": [
          {"text": "Yes, I hear a whirring sound", "next": "check_spark"},
          {"text": "No sound from fuel pump", "next": "fuel_pump_issue"}
        ]
      },
      {
        "id": "battery_result",
        "type": "question",
        "text": "What is the battery voltage?",
        "safety": "green",
        "options": [
          {"text": "Below 12.0V", "next": "charge_battery"},
          {"text": "12.0V or higher", "next": "check_starter"}
        ]
      },
      {
        "id": "charge_battery",
        "type": "solution",
        "text": "Battery is discharged",
        "safety": "green",
        "action": "Charge battery or jump-start",
        "details": "Use a battery tender or jump-start from another vehicle. If battery won''t hold charge, replace it."
      },
      {
        "id": "check_starter",
        "type": "solution",
        "text": "Battery is good - check starter motor and relay",
        "safety": "yellow",
        "action": "Test starter relay and inspect starter motor",
        "details": "Swap relay with another to test. If relay is good, starter motor may be seized."
      },
      {
        "id": "check_spark",
        "type": "check",
        "text": "Check for spark at spark plugs",
        "safety": "yellow",
        "warning": "Ignition systems can shock. Use insulated tools.",
        "instructions": "Remove spark plug, reconnect wire, ground plug to engine, and crank. Look for blue spark.",
        "next": "spark_result"
      },
      {
        "id": "spark_result",
        "type": "question",
        "text": "Do you see a strong blue spark?",
        "safety": "yellow",
        "options": [
          {"text": "Yes, strong spark", "next": "fuel_delivery"},
          {"text": "No spark or weak spark", "next": "ignition_issue"}
        ]
      },
      {
        "id": "ignition_issue",
        "type": "solution",
        "text": "Ignition system problem",
        "safety": "yellow",
        "action": "Check ignition coils, plug wires, and ECU",
        "details": "Test coils with multimeter. Check for damaged wires. Verify kill switch is off."
      },
      {
        "id": "fuel_delivery",
        "type": "solution",
        "text": "Fuel delivery issue",
        "safety": "yellow",
        "action": "Check fuel pressure, injectors, and fuel filter",
        "details": "Ensure fuel is flowing from tank. Check for clogged filter or faulty injectors."
      },
      {
        "id": "fuel_pump_issue",
        "type": "solution",
        "text": "Fuel pump not priming",
        "safety": "yellow",
        "action": "Check fuel pump fuse and relay",
        "details": "Locate fuel pump fuse and relay in fuse box. Test and replace if needed."
      }
    ]
  }'::jsonb
FROM motorcycles
WHERE make = 'Honda' AND model = 'CBR600RR'
LIMIT 1;

-- Insert sample diagnostic tree (Won't Idle for Yamaha MT-07)
INSERT INTO diagnostic_trees (motorcycle_id, title, description, category, difficulty, tree_data)
SELECT
  id,
  'Won''t Idle / Stalls',
  'Diagnose idle issues including stalling, rough idle, and hunting.',
  'fuel',
  'intermediate',
  '{
    "nodes": [
      {
        "id": "start",
        "type": "question",
        "text": "When does the bike stall?",
        "safety": "green",
        "options": [
          {"text": "Immediately after starting", "next": "immediate"},
          {"text": "After warming up", "next": "warm"},
          {"text": "Only when giving throttle", "next": "throttle"}
        ]
      },
      {
        "id": "immediate",
        "type": "question",
        "text": "Does it run with choke on?",
        "safety": "green",
        "options": [
          {"text": "Yes, runs with choke", "next": "lean_condition"},
          {"text": "No, stalls even with choke", "next": "severe_issue"}
        ]
      },
      {
        "id": "lean_condition",
        "type": "solution",
        "text": "Lean fuel mixture",
        "safety": "yellow",
        "action": "Clean air filter, check for vacuum leaks, sync throttle bodies",
        "details": "Inspect intake boots for cracks. Check all vacuum lines. Clean or replace air filter."
      },
      {
        "id": "severe_issue",
        "type": "solution",
        "text": "Severe fuel or ignition issue",
        "safety": "red",
        "action": "Professional diagnosis recommended",
        "details": "May require ECU diagnostics, fuel pressure testing, or valve timing check."
      },
      {
        "id": "warm",
        "type": "solution",
        "text": "Heat-related issue",
        "safety": "yellow",
        "action": "Check coolant level, thermostat, and engine temp sensor",
        "details": "Overheating can cause stalling. Verify cooling system is working properly."
      },
      {
        "id": "throttle",
        "type": "solution",
        "text": "Throttle position or air intake issue",
        "safety": "yellow",
        "action": "Clean throttle bodies and check TPS sensor",
        "details": "Remove throttle bodies and clean with throttle body cleaner. Test TPS voltage."
      }
    ]
  }'::jsonb
FROM motorcycles
WHERE make = 'Yamaha' AND model = 'MT-07';
