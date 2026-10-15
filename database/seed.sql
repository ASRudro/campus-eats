-- =======================================================
-- CampusEats - University Canteen Food Pre-Ordering System
-- Database Seed Data (MySQL Compatible)
-- =======================================================

USE campuseats;

-- 1. SEED USERS (Passwords hashed using bcrypt, salt rounds 10)
-- Admin:    admin@campuseats.com   / Admin123!
-- Kitchen:  kitchen@campuseats.com / Kitchen123!
-- Student:  tanvir@campuseats.com  / Student123!
INSERT INTO users (id, name, student_id, email, password_hash, phone, role, daily_budget, daily_calorie_limit, loyalty_points)
VALUES 
(1, 'System Administrator', 'ADM-001', 'admin@campuseats.com', '$2a$10$ksIkBSG2YQKfp1Qri.9PWuvCKYlNeFRzP4cE80lfkAEW5GcVV6wVS', '+8801711000001', 'admin', 500.00, 2500, 100),
(2, 'Chief Kitchen Chef', 'KIT-001', 'kitchen@campuseats.com', '$2a$10$f21fH5BB7loB2CYCC1FSReP6X4.8KIrStuIQgdvBrVaMEwJxDnfna', '+8801711000002', 'kitchen', 400.00, 2200, 50),
(3, 'Tanvir Ahmed', '2023-1-60-042', 'tanvir@campuseats.com', '$2a$10$DR0eX9Bqr0gY5nF5uZYFi.i4npSepEHTW9MTw9GAtXNhnVQVAvv06', '+8801711000003', 'student', 350.00, 1800, 45),
(4, 'Nafis Rahman', '2023-1-60-118', 'nafis@campuseats.com', '$2a$10$DR0eX9Bqr0gY5nF5uZYFi.i4npSepEHTW9MTw9GAtXNhnVQVAvv06', '+8801711000004', 'student', 300.00, 1700, 20)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. SEED SHOPS (5 Campus Food Stalls / Canteens)
INSERT INTO shops (id, name, tagline, category_type, description, image_url, rating, delivery_time, location, badge, is_open)
VALUES
(1, 'Campus Kitchen', 'Daily Rice Bowls, Lunch Meals & Canteen Thalis', 'Regular Meals / Lunch & Dinner', 'Your everyday go-to campus cafeteria for fresh, hygienic and filling lunch meals, khichuri, kacchi and student thalis.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80', 4.8, '10-15 min', 'Canteen Building, Ground Floor (Stall #01)', '🍛 Regular Meals', TRUE),
(2, 'Bhojon Bilash', 'Special Deshi Feasts, Biryani & Traditional Delicacies', 'Deshi & Traditional Food', 'Authentic Bangladeshi culinary specialty! Serving tender beef tehari, chicken bhuna khichuri, shahi morog polao and chicken chaap.', '/images/chicken_biryani.jpg', 4.9, '12-15 min', 'Canteen Building, Ground Floor (Stall #02)', '🍲 Deshi Feast', TRUE),
(3, 'Varsity Bites', 'Juicy Burgers, Shawarma, Pasta & Loaded Fries', 'Fast Food & Snacks', 'The ultimate campus fast food station for quick class breaks. Crispy chicken burgers, garlic mayo shawarma, cheesy pasta and hot wings.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', 4.7, '8-12 min', 'Student Lounge & 1st Floor Gallery (Stall #03)', '🍔 Fast Food Hub', TRUE),
(4, 'Fresh Sip Juice Bar', '100% Fresh Fruit Blends, Smoothies, Shakes & Lemonades', 'Fresh Juices & Shakes', 'Chill out with freshly squeezed seasonal juices, fruit smoothies, thick milkshakes, cold coffee and iced lemonades.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', 4.8, '3-5 min', 'Central Courtyard Kiosk (Stall #04)', '🥤 Juice & Shakes', TRUE),
(5, 'The Chai Break', 'Authentic Malai Cha, Hot Brewed Coffee & Crispy Snacks', 'Tea, Coffee & Adda Snacks', 'Campus adda is incomplete without our steaming hot Malai Cha, Masala tea, roasted espresso, hot shingara, porota-dal and brownies.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', 4.9, '2-5 min', 'Library Courtyard / East Pavilion (Stall #05)', '☕ Chai & Adda', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), tagline=VALUES(tagline), category_type=VALUES(category_type), description=VALUES(description), image_url=VALUES(image_url), rating=VALUES(rating), delivery_time=VALUES(delivery_time), location=VALUES(location), badge=VALUES(badge);

-- 3. SEED CATEGORIES
INSERT INTO categories (id, name, description, icon)
VALUES
(1, 'Rice Meals', 'Hearty traditional and continental rice bowls', 'Bowl'),
(2, 'Fast Food', 'Burgers, sandwiches, wraps, and quick bites', 'Utensils'),
(3, 'Snacks', 'Crispy sides and finger foods for quick breaks', 'Cookie'),
(4, 'Drinks', 'Chilled beverages, freshly squeezed juices, and coffee', 'Coffee'),
(5, 'Desserts', 'Sweet treats and freshly baked pastries', 'Cake'),
(6, 'Combo Deals', 'Budget-friendly bundled lunch deals', 'Sparkles')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. SEED MENU ITEMS (Categorized & linked to 5 specific shops)
INSERT INTO menu_items (id, shop_id, category_id, name, description, price, calories, image_url, preparation_time, is_available, is_special, is_combo)
VALUES
-- SHOP 1: Campus Kitchen (Regular Meals / Lunch & Dinner)
(1, 1, 1, 'Authentic Mutton Kacchi', 'Old Dhaka style fragrant basmati saffron rice cooked with tender marinated mutton pieces, golden fried potato, boiled egg, and crispy beresta.', 180.00, 780, '/images/mutton_kacchi.jpg', 15, TRUE, TRUE, FALSE),
(2, 1, 1, 'Authentic Beef Khichuri', 'Slow-cooked roasted moong dal and chinigura rice with spiced beef chunks and green chilies.', 140.00, 720, '/images/beef_khichuri.jpg', 15, TRUE, TRUE, FALSE),
(3, 1, 1, 'Vegetable Rice with Curry & Dal', 'Fluffy steamed basmati served with seasonal farm-fresh vegetable curry and spiced yellow lentils.', 60.00, 450, '/images/vegetable_rice.jpg', 10, TRUE, FALSE, FALSE),
(4, 1, 1, 'Egg Fried Rice with Crispy Chicken', 'Fragrant egg fried rice served with crispy golden fried chicken, savory chili sauce, and fresh cucumber salad.', 130.00, 680, '/images/fried_chicken_rice.jpg', 12, TRUE, TRUE, FALSE),
(5, 1, 1, 'Student Lunch Thali (Chicken Jhal Fry)', 'Fluffy steamed white rice served with spicy Bangladeshi chicken jhal fry in a rich red gravy, yellow dal, and aloo bhorta.', 110.00, 590, '/images/rice_chicken_curry.jpg', 10, TRUE, TRUE, FALSE),
(6, 1, 1, 'Shahi morog Polao with Egg', 'Aromatic Chinigura rice polao served with succulent Shahi chicken roast leg, boiled egg, fresh onion cucumber salad, and sweet-sour plum chutney.', 120.00, 650, '/images/shahi_morog_polao.jpg', 12, TRUE, TRUE, FALSE),
(34, 1, 6, 'Kacchi Fiesta Combo', 'Authentic Mutton Kacchi + Fresh Mint Lemonade + Fudgy Chocolate Cake.', 240.00, 1050, '/images/kacchi_combo.jpg', 15, TRUE, TRUE, TRUE),

-- SHOP 2: Bhojon Bilash (Deshi & Traditional Food)
(7, 2, 1, 'Dhaka Style Chicken Bhuna Khichuri', 'Chinigura rice & roasted moong dal khichuri with spiced roasted chicken, boiled egg, and crispy fried onions.', 120.00, 640, '/images/chicken_khichuri.jpg', 12, TRUE, TRUE, FALSE),
(8, 2, 1, 'Old Town Beef Tehari', 'Aromatic mustard oil cooked chinigura rice loaded with succulent cubed beef pieces and fresh green chilies.', 150.00, 750, '/images/beef_tehari.jpg', 14, TRUE, TRUE, FALSE),
(9, 2, 1, 'Special Chicken Biryani Platter', 'Rich fragrant basmati rice cooked with whole spiced chicken leg quarter, aloo bukhara, and creamy borhani.', 140.00, 710, '/images/chicken_biryani.jpg', 12, TRUE, TRUE, FALSE),
(10, 2, 3, 'Spicy Chicken Chaap with Butter Porota', 'Tender slow-fried spiced chicken chaap with 2 pieces of hot flaky layered porota and onion salad.', 110.00, 580, '/images/chicken_chaap.jpg', 10, TRUE, TRUE, FALSE),
(11, 2, 1, 'Shahi morog Polao with Egg', 'Traditional slow-cooked Bangladeshi sweet spiced chicken roast served over buttery fragrant polao rice with a boiled egg.', 120.00, 720, '/images/shahi_morog_polao.jpg', 12, TRUE, TRUE, FALSE),
(12, 2, 1, 'Special Beef Bhuna Rice Platter', 'Spicy tender beef bhuna in thick onion garlic gravy served with steamed white rice and fresh lime.', 160.00, 690, '/images/rice_chicken_curry.jpg', 12, TRUE, FALSE, FALSE),

-- SHOP 3: Varsity Bites (Fast Food & Snacks)
(13, 3, 2, 'Crispy Chicken Burger', 'Golden fried seasoned chicken patty with melted cheddar, crisp lettuce, and spicy mayo on a toasted brioche bun.', 85.00, 520, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', 10, TRUE, TRUE, FALSE),
(14, 3, 2, 'Special Chicken Shawarma Wrap', 'Warm pita wrap stuffed with grilled spiced chicken slices, crunchy cabbage, and creamy garlic mayonnaise.', 70.00, 420, '/images/chicken_shawarma.jpg', 8, TRUE, TRUE, FALSE),
(15, 3, 2, 'Creamy White Sauce Chicken Pasta', 'Al dente penne pasta tossed in garlic parmesan white sauce, topped with grilled chicken cubes and herbs.', 100.00, 600, '/images/creamy_pasta.jpg', 12, TRUE, FALSE, FALSE),
(16, 3, 3, 'Golden French Fries (Large)', 'Crispy, freshly cut salted potato fries served with zesty garlic dipping mayonnaise.', 45.00, 320, '/images/french_fries.jpg', 6, TRUE, FALSE, FALSE),
(17, 3, 3, 'Smoky BBQ Chicken Wings (6 pcs)', 'Six pieces of crispy chicken wings glazed in sweet & smoky barbecue sauce with sesame sprinkle.', 85.00, 480, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80', 10, TRUE, FALSE, FALSE),
(18, 3, 2, 'Grilled Chicken Club Sandwich', 'Herb-marinated grilled chicken breast slices with cucumber, tomatoes, and garlic spread on whole-wheat bread.', 65.00, 410, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80', 8, TRUE, FALSE, FALSE),
(19, 3, 2, 'Cheesy Loaded Chicken Fries', 'Crispy fries topped with melted mozzarella, minced seasoned chicken, jalapeños, and secret burger sauce.', 95.00, 560, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=80', 8, TRUE, TRUE, FALSE),
(20, 3, 6, 'Student Rush Burger Combo', 'Crispy Chicken Burger + Golden French Fries + Chilled Cold Coffee at a special discounted campus bundle.', 150.00, 890, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&auto=format&fit=crop&q=80', 12, TRUE, TRUE, TRUE),

-- SHOP 4: Fresh Sip Juice Bar (Fresh Juices, Smoothies & Shakes)
(21, 4, 4, 'Chilled Cold Coffee with Ice Cream', 'Rich espresso blended with chilled milk, scoop of vanilla ice cream, and chocolate syrup drizzle.', 50.00, 150, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80', 3, TRUE, TRUE, FALSE),
(22, 4, 4, 'Fresh Mint Lemonade', 'Freshly squeezed lemons with crushed garden mint leaves, Himalayan black salt, and chilled soda.', 30.00, 80, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', 3, TRUE, FALSE, FALSE),
(23, 4, 4, 'Fresh Mango / Kacha Aam Shorbot', 'Seasonal raw green mango juice blended with roasted cumin, green chili, mint, and rock salt.', 40.00, 110, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80', 3, TRUE, TRUE, FALSE),
(24, 4, 4, 'Sweet Shahi Dahi Lassi', 'Traditional blended sweet curd lassi topped with pistachio crush and rose cardamom essence.', 45.00, 180, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80', 4, TRUE, FALSE, FALSE),
(25, 4, 4, 'Fresh Orange & Malta Juice', '100% pure cold-pressed sweet malta and orange juice with zero added artificial sugar.', 50.00, 95, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80', 3, TRUE, FALSE, FALSE),
(26, 4, 4, 'Creamy Strawberry Milkshake', 'Thick fresh strawberry milkshake whipped with real dairy milk and strawberry syrup.', 65.00, 240, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80', 4, TRUE, FALSE, FALSE),

-- SHOP 5: The Chai Break (Tea, Coffee & Campus Snacks)
(27, 5, 4, 'Special Malai Matka Cha', 'Clay cup boiled creamy condensed milk tea with thick malai layer and cardamom aroma.', 25.00, 90, '/images/malai_matka_cha.jpg', 2, TRUE, TRUE, FALSE),
(28, 5, 4, 'Hot Masala Ginger Lemon Tea', 'Spiced CTC black tea infused with fresh ginger, cloves, lemon juice, and rock salt.', 15.00, 30, 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80', 2, TRUE, FALSE, FALSE),
(29, 5, 4, 'Hot Brewed Cappuccino / Espresso', 'Freshly ground roasted Arabica beans brewed with steamed milk foam and cocoa sprinkle.', 40.00, 70, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80', 3, TRUE, FALSE, FALSE),
(30, 5, 3, 'Crispy Hot Shingara', 'Crispy golden triangular pastry shell packed with spicy potato, cauliflower florets, and roasted peanuts, served with tangy sauce (৳10 / piece).', 10.00, 130, '/images/shingara.jpg', 2, TRUE, TRUE, FALSE),
(31, 5, 3, 'Crispy Porota with Dal Bhaji', 'Hot flaky layered parathas served with spiced potato-vegetable bhaji, yellow dal, and green chili.', 35.00, 380, '/images/porota_dal_bhaji.jpg', 5, TRUE, TRUE, FALSE),
(32, 5, 3, 'Crispy Chicken Samucha', 'Flaky golden pastry filled with spicy minced chicken, coriander, and onion filling (৳10 / piece).', 10.00, 120, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', 3, TRUE, FALSE, FALSE),
(33, 5, 5, 'Fudgy Chocolate Brownie Cake', 'Warm Dutch-cocoa chocolate sponge layered with creamy dark chocolate ganache.', 55.00, 390, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80', 3, TRUE, FALSE, FALSE),
(35, 5, 4, 'Special Dudh Cha', 'Rich & creamy boiled full-cream milk tea brewed with premium CTC tea leaves and fragrant cardamom.', 15.00, 75, '/images/special_dudh_cha.jpg', 2, TRUE, TRUE, FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name), shop_id=VALUES(shop_id), category_id=VALUES(category_id), price=VALUES(price), calories=VALUES(calories), image_url=VALUES(image_url), preparation_time=VALUES(preparation_time), is_special=VALUES(is_special), is_combo=VALUES(is_combo);





-- 4. SEED PICKUP TIME SLOTS
INSERT INTO pickup_slots (id, slot_time, is_active, max_orders)
VALUES
(1, '12:00 PM', TRUE, 25),
(2, '12:15 PM', TRUE, 25),
(3, '12:30 PM', TRUE, 25),
(4, '12:45 PM', TRUE, 25),
(5, '1:00 PM', TRUE, 25),
(6, '1:15 PM', TRUE, 25),
(7, '1:30 PM', TRUE, 25),
(8, '1:45 PM', TRUE, 25),
(9, '2:00 PM', TRUE, 25)
ON DUPLICATE KEY UPDATE slot_time=VALUES(slot_time);

-- 5. SEED SAMPLE REVIEWS
INSERT INTO ratings (id, user_id, menu_item_id, rating, comment)
VALUES
(1, 3, 1, 5, 'Best Biryani on campus! Packed with flavor, generous chicken piece, and zero queue wait time.'),
(2, 4, 1, 4, 'Very tasty and hot when picked up at 1:15 PM. Will order again.'),
(3, 3, 5, 5, 'Super crispy chicken patty. The spicy mayo sauce is incredible!'),
(4, 4, 10, 5, 'Perfect cold coffee to get through afternoon lectures.')
ON DUPLICATE KEY UPDATE rating=VALUES(rating);

-- 6. SEED FAVORITES FOR DEMO STUDENT
INSERT INTO favorites (user_id, menu_item_id)
VALUES
(3, 1),
(3, 5),
(3, 10)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- 7. SEED LOYALTY REWARDS
INSERT INTO loyalty_rewards (id, title, description, points_cost, reward_type, menu_item_id, discount_amount, is_active)
VALUES
(1, 'Free Mint Lemonade', 'Redeem 15 loyalty points for a refreshing chilled Mint Lemonade.', 15, 'free_item', 11, 60.00, TRUE),
(2, 'Free Golden Fries', 'Redeem 20 loyalty points for a regular hot basket of French Fries.', 20, 'free_item', 8, 80.00, TRUE),
(3, 'Free Chilled Cold Coffee', 'Redeem 25 loyalty points for a rich Chilled Cold Coffee.', 25, 'free_item', 10, 90.00, TRUE),
(4, '50 BDT Canteen Voucher', 'Get 50 BDT off any lunch order over 150 BDT.', 30, 'discount_voucher', NULL, 50.00, TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 8. SEED LOYALTY TRANSACTIONS FOR DEMO STUDENT
INSERT INTO loyalty_transactions (id, user_id, points, reason)
VALUES
(1, 3, 25, 'Points earned for Order CE-2026-000101'),
(2, 3, 20, 'Points earned for Order CE-2026-000102')
ON DUPLICATE KEY UPDATE points=VALUES(points);

-- 9. SEED PREVIOUS ORDERS (Past history for reorder feature and admin analytics)
INSERT INTO orders (id, order_number, user_id, pickup_date, pickup_time, subtotal, total_calories, estimated_wait_time, status)
VALUES 
(1, 'CE-2026-000101', 3, CURRENT_DATE - INTERVAL 2 DAY, '1:00 PM', 220.00, 650, 15, 'Picked Up'),
(2, 'CE-2026-000102', 3, CURRENT_DATE - INTERVAL 1 DAY, '1:30 PM', 240.00, 670, 13, 'Picked Up'),
(3, 'CE-2026-000103', 4, CURRENT_DATE - INTERVAL 1 DAY, '12:30 PM', 280.00, 890, 18, 'Picked Up'),
(4, 'CE-2026-000104', 3, CURRENT_DATE - INTERVAL 1 DAY, '1:15 PM', 160.00, 520, 14, 'Picked Up')
ON DUPLICATE KEY UPDATE order_number=VALUES(order_number);

INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, calories_at_purchase)
VALUES
(1, 1, 1, 1, 220.00, 650),
(2, 2, 5, 1, 160.00, 520),
(3, 2, 8, 1, 80.00, 150),
(4, 3, 13, 1, 280.00, 890),
(5, 4, 5, 1, 160.00, 520)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);
