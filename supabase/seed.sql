-- CrankDoc Seed Data
-- Pilot motorcycle data for MVP (5 models)

-- Insert pilot motorcycles
INSERT INTO motorcycles (make, model, year_start, year_end, engine_type, displacement_cc, category, image_url) VALUES
  (
    'Honda',
    'CBR600RR',
    2003,
    2024,
    'inline-4',
    599,
    'sport',
    NULL
  ),
  (
    'Yamaha',
    'MT-07',
    2014,
    NULL,  -- Still in production
    'parallel-twin',
    689,
    'naked',
    NULL
  ),
  (
    'Harley-Davidson',
    'Sportster 883',
    1986,
    2022,  -- Last year of Sportster before moving to Sportster S
    'v-twin',
    883,
    'cruiser',
    NULL
  ),
  (
    'Harley-Davidson',
    'Sportster 1200',
    1988,
    2022,
    'v-twin',
    1202,
    'cruiser',
    NULL
  ),
  (
    'Kawasaki',
    'Ninja 400',
    2018,
    NULL,  -- Still in production
    'parallel-twin',
    399,
    'sport',
    NULL
  ),
  (
    'BMW',
    'R1250GS',
    2019,
    NULL,  -- Still in production
    'boxer-twin',
    1254,
    'adventure',
    NULL
  );

-- Insert sample DTC codes (common across motorcycles)
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

-- Insert sample diagnostic tree (Engine Won't Start for Honda CBR600RR)
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
WHERE make = 'Honda' AND model = 'CBR600RR';

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
