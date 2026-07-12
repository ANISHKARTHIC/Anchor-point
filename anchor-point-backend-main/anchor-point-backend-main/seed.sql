-- Add pricing for vendor (id 1)
INSERT INTO hotel_pricing (vendor_id, meal_plan_id, room_category_id, single_room_rate, double_room_rate, inclusions, mdate)
VALUES 
(1, (SELECT id FROM hotel_meal_plans WHERE name='Breakfast Included' LIMIT 1), (SELECT id FROM hotel_room_categories WHERE name='Standard' LIMIT 1), 5000, 7000, 'Free WiFi', now()),
(1, (SELECT id FROM hotel_meal_plans WHERE name='All Inclusive' LIMIT 1), (SELECT id FROM hotel_room_categories WHERE name='Suite' LIMIT 1), 15000, 18000, 'Free WiFi, Spa, Pool', now());
