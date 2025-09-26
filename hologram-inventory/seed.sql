INSERT INTO inventory (sku, name, description, quantity, price, image_url, status)
VALUES
  ('HLG-AXIS-001', 'Aurora Flux Capacitor', 'Stabilized flux capacitor designed for high-bandwidth jump cores.', 42, 1899.00, 'https://images.unsplash.com/photo-1523966211575-eb4a6e9f3bc7?auto=format&fit=crop&w=800&q=80', 'in_stock'),
  ('HLG-AXIS-002', 'Nebula Prism Display', 'Edge-to-edge holographic projection array with adaptive parallax rendering.', 5, 4999.99, 'https://images.unsplash.com/photo-1580894894513-541e068a00c5?auto=format&fit=crop&w=800&q=80', 'low'),
  ('HLG-AXIS-003', 'Quantum Field Emitter', 'Emitter module for localized gravity shaping and defensive shielding.', 0, 3290.50, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 'out_of_stock'),
  ('HLG-AXIS-004', 'Spectral Analyzer Kit', 'Portable spectrum analyzer for real-time environmental diagnostics.', 12, 899.00, NULL, 'in_stock'),
  ('HLG-AXIS-005', 'Cryo-Cell Cartridge', 'Rapid-exchange cryogenic cartridge for medical stasis pods.', 2, 159.75, 'https://images.unsplash.com/photo-1555618568-00b3cddf4cda?auto=format&fit=crop&w=800&q=80', 'low'),
  ('HLG-AXIS-006', 'MagLift Boots', 'Discontinued magnetic boots with adaptive traction and dampening.', 0, 349.95, NULL, 'discontinued'),
  ('HLG-AXIS-007', 'Pulse Drone Scout', 'Autonomous recon drone with tri-sensor array and stealth coatings.', 18, 1299.00, 'https://images.unsplash.com/photo-1542272605-6065e0f7f4e5?auto=format&fit=crop&w=800&q=80', 'in_stock'),
  ('HLG-AXIS-008', 'Photon Blade Elite', 'High-frequency photon blade for close-quarters maintenance operations.', 0, 649.00, 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=800&q=80', 'out_of_stock'),
  ('HLG-AXIS-009', 'Holo-Room Projector', 'Room-scale holographic projection platform with multi-user sensors.', 9, 7749.00, 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80', 'in_stock'),
  ('HLG-AXIS-010', 'Atmos Filter Core', 'Replacement nano-filtration core for long-haul habitat support.', 27, 289.40, NULL, 'in_stock')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  quantity = VALUES(quantity),
  price = VALUES(price),
  image_url = VALUES(image_url),
  status = VALUES(status);
