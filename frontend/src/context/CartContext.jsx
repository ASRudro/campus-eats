import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const SHOP_METADATA = {
  1: {
    id: 1,
    name: 'Campus Kitchen',
    stall_number: 'Stall #01',
    badge: '🍛 Cafeteria Main',
    category: 'Rice Meals, Biryani & Khichuri',
    location: 'Ground Floor Central Food Court (Stall #01)',
    tagline: 'Fresh Homestyle Lunch, Traditional Biryani & Meal Platters',
    theme_color: '#059669',
    badge_bg: '#ecfdf5',
    badge_border: '#a7f3d0'
  },
  2: {
    id: 2,
    name: 'Bhojon Bilash',
    stall_number: 'Stall #02',
    badge: '🍲 Deshi Gharana',
    category: 'Deshi & Traditional Food',
    location: '1st Floor South Wing (Stall #02)',
    tagline: 'Old Dhaka Style Tehari, Bhuna Khichuri & Shahi Roast',
    theme_color: '#d97706',
    badge_bg: '#fffbeb',
    badge_border: '#fde68a'
  },
  3: {
    id: 3,
    name: 'Varsity Bites',
    stall_number: 'Stall #03',
    badge: '🍔 Fast Food Corner',
    category: 'Burgers, Shawarma & Loaded Fries',
    location: 'Ground Floor West Hub (Stall #03)',
    tagline: 'Juicy Burgers, Shawarma Wraps, Loaded Fries & Wings',
    theme_color: '#dc2626',
    badge_bg: '#fef2f2',
    badge_border: '#fecaca'
  },
  4: {
    id: 4,
    name: 'Fresh Sip Juice Bar',
    stall_number: 'Stall #04',
    badge: '🥤 Juice & Shakes',
    category: 'Fresh Juices, Smoothies & Shakes',
    location: 'Ground Floor North Courtyard (Stall #04)',
    tagline: '100% Pure Cold-Pressed Juices, Smoothies, Shakes & Lassi',
    theme_color: '#0284c7',
    badge_bg: '#f0f9ff',
    badge_border: '#bae6fd'
  },
  5: {
    id: 5,
    name: 'The Chai Break',
    stall_number: 'Stall #05',
    badge: '☕ Chai & Adda',
    category: 'Tea, Coffee & Adda Snacks',
    location: 'Library Courtyard / East Pavilion (Stall #05)',
    tagline: 'Authentic Malai Cha, Hot Brewed Coffee & Crispy Snacks',
    theme_color: '#7c3aed',
    badge_bg: '#f5f3ff',
    badge_border: '#ddd6fe'
  }
};

export function resolveShop(item) {
  if (item?.shop_id && SHOP_METADATA[item.shop_id]) {
    const meta = SHOP_METADATA[item.shop_id];
    return {
      shop_id: item.shop_id,
      shop_name: item.shop_name || meta.name,
      shop_badge: item.shop_badge || meta.badge,
      shop_location: item.shop_location || meta.location,
      stall_number: meta.stall_number,
      shop_theme: meta
    };
  }

  const id = Number(item?.id || item?.menu_item_id || 0);
  let sId = 1;
  if (id === 34 || (id >= 1 && id <= 6)) sId = 1;
  else if (id >= 7 && id <= 12) sId = 2;
  else if (id >= 13 && id <= 20) sId = 3;
  else if (id >= 21 && id <= 26) sId = 4;
  else if (id >= 27 && id <= 35) sId = 5;

  const s = SHOP_METADATA[sId];
  return {
    shop_id: sId,
    shop_name: s.name,
    shop_badge: s.badge,
    shop_location: s.location,
    stall_number: s.stall_number,
    shop_theme: s
  };
}

export function CartProvider({ children }) {
  const { dailyUsage, user } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('campuseats_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map(item => {
        const shop = resolveShop(item);
        return {
          ...item,
          shop_id: shop.shop_id,
          shop_name: shop.shop_name,
          shop_badge: shop.shop_badge,
          shop_location: shop.shop_location,
          stall_number: shop.stall_number
        };
      });
    } catch {
      return [];
    }
  });

  const [pickupSlot, setPickupSlot] = useState('1:00 PM');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('campuseats_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart Metrics
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCalories = cart.reduce((sum, item) => sum + item.calories * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // User Limits
  const budgetLimit = user?.daily_budget || dailyUsage?.daily_budget || 300;
  const calorieLimit = user?.daily_calorie_limit || dailyUsage?.daily_calorie_limit || 1800;
  const spentToday = dailyUsage?.spent_today || 0;
  const caloriesToday = dailyUsage?.calories_today || 0;

  // Real-time Projected Totals (Today's placed orders + Current cart)
  const projectedSpent = spentToday + subtotal;
  const projectedCalories = caloriesToday + totalCalories;

  const isOverBudget = projectedSpent > budgetLimit;
  const isOverCalories = projectedCalories > calorieLimit;

  const budgetPercent = budgetLimit > 0 ? Math.min(100, Math.round((projectedSpent / budgetLimit) * 100)) : 0;
  const caloriePercent = calorieLimit > 0 ? Math.min(100, Math.round((projectedCalories / calorieLimit) * 100)) : 0;

  // Add Item to Cart
  const addToCart = (item, quantity = 1) => {
    const shop = resolveShop(item);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { 
            ...i, 
            ...shop,
            quantity: i.quantity + quantity 
          } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          calories: Number(item.calories),
          image_url: item.image_url,
          preparation_time: Number(item.preparation_time),
          quantity: quantity,
          shop_id: shop.shop_id,
          shop_name: shop.shop_name,
          shop_badge: shop.shop_badge,
          shop_location: shop.shop_location,
          stall_number: shop.stall_number
        }
      ];
    });
  };

  // Remove Item
  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Update Quantity
  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('campuseats_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        totalCalories,
        totalItems,
        pickupSlot,
        setPickupSlot,
        pickupDate,
        setPickupDate,
        specialInstructions,
        setSpecialInstructions,
        // Guardrail Metrics
        budgetLimit,
        calorieLimit,
        spentToday,
        caloriesToday,
        projectedSpent,
        projectedCalories,
        isOverBudget,
        isOverCalories,
        budgetPercent,
        caloriePercent,
        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
