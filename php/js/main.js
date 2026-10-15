// CampusEats Client-Side AJAX and Interaction Scripts

function showToast(message, type = 'success') {
  const existing = document.getElementById('campus-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'campus-toast';
  toast.className = `flash-alert flash-${type}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  toast.style.animation = 'fadeInUp 0.3s ease';
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// AJAX Add to Cart
async function addToCart(itemId, quantity = 1) {
  try {
    const formData = new FormData();
    formData.append('action', 'add');
    formData.append('item_id', itemId);
    formData.append('quantity', quantity);

    const res = await fetch('api/cart-actions.php', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      const badge = document.getElementById('cart-badge-count');
      if (badge) badge.innerText = data.cart_count;
      showToast(data.message || 'Item added to tray!', 'success');
    } else {
      showToast(data.message || 'Failed to add item', 'error');
    }
  } catch (err) {
    showToast('Network error adding to cart', 'error');
  }
}

// AJAX Toggle Favorite
async function toggleFavorite(itemId, btnElement) {
  try {
    const formData = new FormData();
    formData.append('item_id', itemId);

    const res = await fetch('api/toggle-favorite.php', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      if (btnElement) {
        if (data.is_favorite) {
          btnElement.innerHTML = '❤️';
          showToast('Added to your favorite meals!', 'success');
        } else {
          btnElement.innerHTML = '🤍';
          showToast('Removed from favorites', 'success');
        }
      }
    } else {
      showToast(data.message || 'Please log in to save favorites', 'error');
    }
  } catch (err) {
    showToast('Failed to update favorite', 'error');
  }
}

// Auto-refresh for Kitchen Dashboard every 10 seconds
if (window.location.pathname.includes('kitchen.php')) {
  setInterval(() => {
    // Optionally auto-poll if viewing queue
  }, 10000);
}
