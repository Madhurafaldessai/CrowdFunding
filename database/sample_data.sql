-- ============================================================================
-- CROWDFUNDING PLATFORM SAMPLE DATA
-- Internally consistent seed data for all entities
-- Password for all normal demo users: User123!
-- Password for demo admin: Admin123!
-- ============================================================================

USE `crowdfunding_platform`;

DROP TRIGGER IF EXISTS `trg_pledges_before_insert`;
DROP TRIGGER IF EXISTS `trg_pledges_after_insert`;
DROP TRIGGER IF EXISTS `trg_pledges_after_update`;
DROP TRIGGER IF EXISTS `trg_campaigns_after_update`;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `refunds`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `pledges`;
TRUNCATE TABLE `comments`;
TRUNCATE TABLE `campaign_updates`;
TRUNCATE TABLE `reward_tiers`;
TRUNCATE TABLE `campaigns`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `audit_log`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Categories (6 categories)
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`) VALUES
(1, 'Technology', 'technology', 'Innovative hardware, software, robotics, and smart devices.', 'Cpu'),
(2, 'Games', 'games', 'Tabletop games, indie video games, immersive RPGs, and VR.', 'Gamepad2'),
(3, 'Design & Art', 'design-art', 'Industrial product design, photography, graphic novels, and crafts.', 'Palette'),
(4, 'Film & Video', 'film-video', 'Independent documentaries, narrative cinema, and web series.', 'Film'),
(5, 'Music & Audio', 'music-audio', 'Vinyl records, studio albums, synthesizers, and audio gear.', 'Music'),
(6, 'Publishing', 'publishing', 'Books, poetry collections, journals, and investigative journalism.', 'BookOpen');

-- ----------------------------------------------------------------------------
-- 2. Users (12 users, including admin, creators, and backers)
-- Password for admin: Admin123!
-- Password for others: User123!
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `bio`, `avatar_url`) VALUES
(1, 'System Administrator', 'admin@crowdfund.io', '$2b$10$Kwt3b2QJrCGdAWRDvPCVmOc4n49PizgK6tK.uAl4rwEKs6meDjrfq', 'admin', 'active', 'Platform operations and moderation team.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(2, 'Alice Wright', 'alice@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Hardware inventor and roboticist from Seattle.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(3, 'Bob Chen', 'bob@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Indie game developer & pixel art enthusiast.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(4, 'Clara Garcia', 'clara@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Sustainable product designer and ceramicist.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'),
(5, 'David Kim', 'david@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Documentary filmmaker covering climate solutions.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
(6, 'Emma Watson', 'emma@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Audiophile and electronic music composer.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(7, 'Frank Miller', 'frank@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Sci-fi author and graphic novel creator.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
(8, 'Grace Hopper', 'grace@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Avid tech backer and open-source advocate.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
(9, 'Henry Ford', 'henry@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Board game collector and community organizer.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
(10, 'Ivy Taylor', 'ivy@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Passionate supporter of independent cinema.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150'),
(11, 'Demo Backer', 'backer@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Ready-to-use demo backer account.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
(12, 'Demo Creator', 'creator@crowdfund.io', '$2b$10$DdBiXKAUHS.8qGEMGslVNOL4VamJuSGOcxJ2dtEBCLidOMSRBvNCq', 'user', 'active', 'Ready-to-use demo creator account.', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150');

-- ----------------------------------------------------------------------------
-- 3. Campaigns (16 campaigns with varied statuses: active, draft, pending, successful, failed, cancelled)
-- ----------------------------------------------------------------------------
INSERT INTO `campaigns` (`id`, `creator_id`, `category_id`, `title`, `description`, `story`, `image_url`, `goal_amount`, `current_amount`, `backer_count`, `status`, `start_date`, `deadline`, `rejection_reason`) VALUES
-- Active Campaigns (future deadlines)
(1, 2, 1, 'NeuroPulse: Open-Source Brain-Computer Interface', 'A modular, high-precision EEG headset for researchers, developers, and biohackers.', 'NeuroPulse brings laboratory-grade neural telemetry to every developer. Featuring 16 ultra-low noise dry electrodes, 24-bit ADCs, Bluetooth 5.3 Low Energy, and full Python/C++ SDK support, NeuroPulse enables real-time brainwave decoding and assistive robotics.', 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800', 50000.00, 36250.00, 8, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 20 DAY), NULL),
(2, 3, 2, 'Chronicles of Aethelgard: Isometric Tactical RPG', 'A turn-based fantasy RPG with deep party customization and branching narrative choices.', 'Journey through the fractured realm of Aethelgard. Lead a band of outcasts through tactical grid-based battles with physics interactions, elemental chaining, hand-drawn pixel graphics, and an orchestral soundtrack recorded live in Prague.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800', 35000.00, 42000.00, 9, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 DAY), NULL),
(3, 4, 3, 'Lumina: Solar-Powered Minimalist Kinetic Lamp', 'Precision-machined aerospace aluminum ambient light that simulates natural circadian rhythms.', 'Crafted from solid aerospace aluminum with brass counterweights, Lumina captures sunlight during the day and delivers calming, ultra-high CRI light at dusk. Completely cord-free and engineered to last for generations.', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800', 20000.00, 14500.00, 5, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 25 DAY), NULL),
(4, 5, 4, 'Vanishing Glaciers: An Arctic Expedition Film', 'Feature-length 8K documentary chronicling the fragile ice shelves of Svalbard.', 'Our cinematographers spent six months documenting calving ice shelves, polar wildlife habitats, and the field scientists racing against rising ocean temperatures. Backing this project funds final color grading and festival distribution.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 60000.00, 28000.00, 6, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 12 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 18 DAY), NULL),
(5, 6, 5, 'Resonance Synthesizer: Analog Semi-Modular Power', 'Pure discrete analog synth circuitry with dual ladder filters and patch bay.', 'Designed for stage and studio, Resonance combines vintage warmth with modern MIDI 2.0 integration. Features two voltage-controlled oscillators, analog spring reverb simulation, and 32 patch points.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', 40000.00, 41500.00, 7, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 20 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 DAY), NULL),
(6, 7, 6, 'Tales from the Starlight Void: Illustrated Sci-Fi', 'Deluxe hardcover anthology featuring 20 short stories with foil-stamped illustrations.', 'An epic journey across alien worlds, ancient megastructures, and deep space derelicts. Printed on 140gsm archival grade paper with custom ribbon bookmarks and gilded page edges.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', 15000.00, 8400.00, 4, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 22 DAY), NULL),
(7, 12, 1, 'OmniGrip: Ergonomic Mechanical Keyboard Kit', 'Split ortholinear mechanical keyboard with hot-swap sockets and custom CNC aluminum tenting.', 'Say goodbye to wrist pain. OmniGrip features completely split halves with adjustable multi-axis tenting legs, per-key RGB backlighting, QMK/VIA firmware, and custom PBT dye-sub keycaps.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 25000.00, 19200.00, 5, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 DAY), NULL),

-- Successful Campaigns (past deadlines, goal met)
(8, 2, 1, 'SolarStash: Portable LiFePO4 Solid-State Power', 'Safe, ultralight 500Wh backup battery with bidirectional USB-C PD 140W.', 'Completed successfully. Production units have been inspected, safety certifications acquired, and first batch tooling has completed without defects.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', 45000.00, 62000.00, 10, 'successful', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 DAY), NULL),
(9, 3, 2, 'Starfall Tactics: Tabletop Miniature Wargame', 'Fast-paced tabletop skirmish game with 32mm injection-molded resin miniatures.', 'Funded beyond our wildest expectations. All stretch goals unlocked, including the Void Kraken boss model and neoprene playmats.', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800', 30000.00, 48500.00, 8, 'successful', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 75 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 20 DAY), NULL),
(10, 4, 3, 'Terraforma: Biodegradable Plant-Based Watch', 'Precision Swiss automatic movement housed in recycled flax-fiber composite.', 'Overfunded! The watch cases have entered CNC machining and the vegetable-tanned Italian leather straps are in production.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 25000.00, 31200.00, 6, 'successful', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 35 DAY), NULL),

-- Failed Campaigns (past deadlines, goal missed, refunded)
(11, 5, 4, 'Shadows of the Deep: Submarine Horror Film', 'Psychological thriller shot on location in decommissioned Cold War submarine.', 'Campaign did not reach the minimum threshold to secure location permits and safety divers. All backer pledges were automatically refunded.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 80000.00, 12500.00, 3, 'failed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 50 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY), NULL),
(12, 6, 5, 'Acoustic Oasis: Hand-Carved Mahogany Ukuleles', 'Master-grade solid Honduran mahogany concert and tenor instruments.', 'Unfortunately fell short of our luthier workshop tooling minimums. Pledges refunded in full.', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800', 20000.00, 4200.00, 2, 'failed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 40 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY), NULL),

-- Pending Approval (submitted for admin review)
(13, 7, 6, 'The Cyberpunk Codex: Lorebook & World Guide', '250 pages of dystopian technology, faction histories, and neon-lit street slang.', 'Submitted for community approval. Includes high-resolution schematic fold-outs and companion digital soundtrack.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800', 18000.00, 0.00, 0, 'pending_approval', NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY), NULL),
(14, 12, 2, 'Pixel Dungeon Crawl: Physical Deckbuilder', 'Rogue-like deckbuilding game packed into a portable retro tin case.', 'Submitted for platform verification. Features 200 foil tarot-sized cards, enamel counters, and custom acrylic tokens.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', 12000.00, 0.00, 0, 'pending_approval', NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY), NULL),

-- Drafts (creator working on details)
(15, 2, 1, 'HyperDrive SSD: PCIe 5.0 Liquid-Cooled Enclosure', 'Extreme performance external storage with active micro-pumping thermal dissipation.', 'Draft in progress. Finalizing test benchmarks and component supplier certifications.', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800', 35000.00, 0.00, 0, 'draft', NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 45 DAY), NULL),

-- Cancelled
(16, 4, 3, 'AeroBackpack: Carbon-Weave Commuter Bag', 'Ultralight waterproof travel pack with integrated wireless charging bay.', 'Cancelled by creator due to global composite supply chain delays.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 28000.00, 0.00, 0, 'cancelled', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 25 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 DAY), 'Creator cancelled prior to manufacturing.');

-- ----------------------------------------------------------------------------
-- 4. Reward Tiers
-- ----------------------------------------------------------------------------
INSERT INTO `reward_tiers` (`id`, `campaign_id`, `title`, `description`, `min_amount`, `quantity`, `claimed_quantity`, `estimated_delivery`) VALUES
-- Campaign 1: NeuroPulse
(1, 1, 'Early Supporter Patch & SDK Access', 'Digital developer SDK, documentation, community Discord access, and an embroidered backer patch.', 25.00, NULL, 3, 'Dec 2026'),
(2, 1, 'NeuroPulse Core Kit (Early Bird)', 'Complete 8-channel EEG headband, USB-C receiver, dry electrodes, and carry case. 40% off retail.', 299.00, 50, 4, 'Feb 2027'),
(3, 1, 'NeuroPulse Pro Researcher Bundle', 'Full 16-channel headset with active shielding, impedance checker, and lifetime research license.', 699.00, 20, 1, 'Mar 2027'),

-- Campaign 2: Aethelgard
(4, 2, 'Digital Squire', 'Full game digital download key (Steam/GOG) plus HD digital wallpaper pack and soundtrack.', 25.00, NULL, 4, 'Jan 2027'),
(5, 2, 'Knight Commander (Early Bird)', 'Digital key, beta test access, digital artbook, and in-game exclusive cosmetic armor set.', 60.00, 100, 3, 'Nov 2026'),
(6, 2, 'Physical Collector Edition', 'Custom illustrated big-box, cloth map of Aethelgard, metal coin set, and 120-page hardcover artbook.', 150.00, 50, 2, 'Feb 2027'),

-- Campaign 3: Lumina Lamp
(7, 3, 'Desk Edition Lumina', 'Compact Lumina lamp in matte anodized black or silver finish with magnetic charging base.', 150.00, 100, 3, 'Dec 2026'),
(8, 3, 'Signature Brass & Obsidian Edition', 'Numbered limited run featuring solid raw brass accents and black obsidian base stone.', 350.00, 25, 2, 'Jan 2027'),

-- Campaign 4: Vanishing Glaciers
(9, 4, 'Digital Premiere Stream', 'Private 4K digital stream link before public release, plus PDF production diary.', 30.00, NULL, 3, 'Dec 2026'),
(10, 4, 'Signed Collector 4K Blu-ray + Photobook', 'Deluxe dual-disc 4K UHD Blu-ray with Director commentary and 100-page expedition photobook.', 120.00, 100, 3, 'Feb 2027'),

-- Campaign 5: Resonance Synthesizer
(11, 5, 'Eurorack Filter Module', 'Stand-alone 12HP eurorack dual analog filter module based on the Resonance synth engine.', 199.00, 60, 3, 'Jan 2027'),
(12, 5, 'Resonance Desktop Synthesizer', 'Complete semi-modular analog desktop synthesizer with 10 braided patch cables and wood side panels.', 599.00, 40, 4, 'Mar 2027'),

-- Campaign 6: Tales from Starlight
(13, 6, 'Deluxe Hardcover Edition', 'Embossed foil hardcover edition with all unlocked stretch-goal illustration plates.', 45.00, 500, 3, 'Nov 2026'),
(14, 6, 'Slipcase Archival Collector Box', 'Hardcover book inside a velvet-lined magnetic slipcase, accompanied by 5 signed fine-art prints.', 120.00, 50, 1, 'Dec 2026'),

-- Campaign 7: OmniGrip Keyboard
(15, 7, 'Barebones DIY Kit', 'PCB set, FR4 plates, CNC aluminum base cases, rubber feet, and hardware. Bring your own switches.', 160.00, 100, 3, 'Dec 2026'),
(16, 7, 'Pre-Built Assembled Edition', 'Fully assembled with lubed linear switches, custom PBT keycaps, carrying sleeve, and TRRS cable.', 280.00, 50, 2, 'Jan 2027'),

-- Campaign 8: SolarStash (Successful)
(17, 8, 'SolarStash 500Wh Station', 'Solid-state 500Wh power station with 140W USB-C PD and folding 60W solar panel.', 399.00, 150, 10, 'Completed'),

-- Campaign 9: Starfall Tactics (Successful)
(18, 9, 'Core Skirmish Box', 'Two full starting warbands (24 miniatures), terrain tiles, dice, rulebook, and tokens.', 85.00, 200, 8, 'Completed'),

-- Campaign 10: Terraforma Watch (Successful)
(19, 10, 'Terraforma Classic Automatic', 'Swiss Sellita SW200-1 movement with vegetable-dyed strap and exhibition sapphire back.', 499.00, 50, 6, 'Completed'),

-- Campaign 11: Shadows of Deep (Failed)
(20, 11, 'Digital Screener', 'Online stream of completed horror movie.', 25.00, 500, 2, 'Refunded'),

-- Campaign 12: Acoustic Oasis (Failed)
(21, 12, 'Concert Mahogany Ukulele', 'Handcrafted instrument with bone nut and Aquila strings.', 250.00, 50, 2, 'Refunded');

-- ----------------------------------------------------------------------------
-- 5. Pledges & Payments & Refunds (45 realistic pledges across campaigns)
-- ----------------------------------------------------------------------------
-- Active Campaign 1 Pledges (8 pledges, total = $36,250)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(1,  6,  1, 1,    50.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 9 DAY)),
(2,  7,  1, 2,   300.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY)),
(3,  8,  1, 2,   300.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(4,  9,  1, 2,   300.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY)),
(5,  10, 1, 3,  1000.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(6,  11, 1, 2,   300.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
(7,  8,  1, NULL, 15000.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
(8,  9,  1, NULL, 19000.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY));

-- Active Campaign 2 Pledges (9 pledges, total = $42,000)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(9,  2,  2, 4,    30.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY)),
(10, 4,  2, 4,    25.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 13 DAY)),
(11, 6,  2, 5,    65.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 12 DAY)),
(12, 7,  2, 5,    60.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 11 DAY)),
(13, 8,  2, 6,   160.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)),
(14, 9,  2, 6,   160.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 9 DAY)),
(15, 10, 2, 4,    25.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY)),
(16, 11, 2, 5,    75.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(17, 8,  2, NULL, 41400.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY));

-- Active Campaign 3 Pledges (5 pledges, total = $14,500)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(18, 6,  3, 7,   150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
(19, 7,  3, 7,   150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
(20, 8,  3, 8,   350.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
(21, 9,  3, 8,   350.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY)),
(22, 11, 3, NULL, 13500.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY));

-- Active Campaign 4 Pledges (6 pledges, total = $28,000)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(23, 2,  4, 9,    30.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 11 DAY)),
(24, 3,  4, 9,    40.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)),
(25, 7,  4, 10,  130.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 9 DAY)),
(26, 8,  4, 10,  150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY)),
(27, 10, 4, 10,  150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(28, 11, 4, NULL, 27500.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY));

-- Active Campaign 5 Pledges (7 pledges, total = $41,500)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(29, 2,  5, 11,  200.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 18 DAY)),
(30, 4,  5, 11,  200.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 17 DAY)),
(31, 8,  5, 12,  600.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 DAY)),
(32, 9,  5, 12,  600.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY)),
(33, 10, 5, 12,  600.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 12 DAY)),
(34, 11, 5, 12,  600.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)),
(35, 7,  5, NULL, 38700.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY));

-- Active Campaign 6 Pledges (4 pledges, total = $8,400)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(36, 2,  6, 13,   50.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(37, 8,  6, 13,   50.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY)),
(38, 9,  6, 14,  150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(39, 11, 6, NULL, 8150.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY));

-- Active Campaign 7 Pledges (5 pledges, total = $19,200)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(40, 3,  7, 15,  160.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(41, 6,  7, 15,  160.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
(42, 8,  7, 16,  290.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
(43, 9,  7, 16,  290.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY)),
(44, 11, 7, NULL, 18300.00, 'confirmed', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY));

-- Failed Campaign 11 Pledges (refunded)
INSERT INTO `pledges` (`id`, `backer_id`, `campaign_id`, `tier_id`, `amount`, `status`, `created_at`) VALUES
(45, 8, 11, 20, 25.00, 'refunded', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 45 DAY)),
(46, 9, 11, 20, 25.00, 'refunded', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 44 DAY));

-- Payments for confirmed and refunded pledges
INSERT INTO `payments` (`id`, `pledge_id`, `amount`, `status`, `transaction_ref`, `gateway_response`, `created_at`)
SELECT
  p.`id`,
  p.`id`,
  p.`amount`,
  'successful',
  CONCAT('txn_mock_seed_', p.`id`),
  JSON_OBJECT('provider', 'MockPaymentService', 'status', 'APPROVED', 'amount', p.`amount`, 'currency', 'USD'),
  p.`created_at`
FROM `pledges` p;

-- Refunds for refunded pledges
INSERT INTO `refunds` (`id`, `pledge_id`, `amount`, `status`, `refund_ref`, `gateway_response`, `created_at`) VALUES
(1, 45, 25.00, 'processed', 'ref_mock_seed_45', JSON_OBJECT('provider', 'MockPaymentService', 'reason', 'campaign_goal_not_reached'), UTC_TIMESTAMP()),
(2, 46, 25.00, 'processed', 'ref_mock_seed_46', JSON_OBJECT('provider', 'MockPaymentService', 'reason', 'campaign_goal_not_reached'), UTC_TIMESTAMP());

-- ----------------------------------------------------------------------------
-- 6. Campaign Updates
-- ----------------------------------------------------------------------------
INSERT INTO `campaign_updates` (`id`, `campaign_id`, `creator_id`, `title`, `content`, `created_at`) VALUES
(1, 1, 2, 'PCB Prototype Rev 2 Complete!', 'We have finished assembling and bench-testing our second revision board. The signal-to-noise ratio has improved by over 18dB on the frontal EEG channels! Photos and lab test data attached.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)),
(2, 2, 3, 'Combat Animation Preview & Sound Design', 'Watch our lead animator showcase the dynamic parry system and custom sword impact sound recordings from our foley studio session.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(3, 8, 2, 'Tooling Complete! Shipping on Schedule', 'The injection molds for the battery casing have been certified. First container loads will depart next Tuesday.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY));

-- ----------------------------------------------------------------------------
-- 7. Comments
-- ----------------------------------------------------------------------------
INSERT INTO `comments` (`id`, `campaign_id`, `user_id`, `comment`, `created_at`) VALUES
(1, 1, 8, 'Incredible project Alice! Will the Bluetooth interface support standard LSL (Lab Streaming Layer) directly out of the box?', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
(2, 1, 2, '@Grace Absolutely! LSL streaming is built natively into our Python driver.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY)),
(3, 2, 9, 'Really excited for the tactile grid combat. Any chance of Steam Deck optimization?', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY)),
(4, 2, 3, '@Henry Yes! We already test daily on Steam Deck and are targeting locked 60 FPS.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(5, 3, 11, 'The brass and obsidian combo looks stunning. Backed!', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY));
