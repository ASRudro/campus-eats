</main>

<footer class="footer">
  <div class="container footer-grid">
    <div>
      <div class="footer-brand">
        <div class="brand-icon" style="background:rgba(5, 150, 105, 0.2); color:#34d399;">
          <i data-lucide="utensils" style="width:18px; height:18px;"></i>
        </div>
        <span>CampusEats</span>
      </div>
      <p style="font-size:0.9rem; line-height:1.6; margin-bottom:1rem;">
        Skip the rush hour 30-minute cafeteria queues. Pre-order hearty student meals, maintain your daily budget caps, and pick up fresh meals at scheduled 15-minute windows.
      </p>
      <div style="display:flex; gap:0.5rem;">
        <span class="badge badge-green">⚡ Fast Pickup</span>
        <span class="badge badge-amber">🛡️ Budget Guardrail</span>
      </div>
    </div>

    <div>
      <h4 class="footer-title">Navigation</h4>
      <ul class="footer-links">
        <li><a href="index.php">Home</a></li>
        <li><a href="menu.php">Cafeteria Menu</a></li>
        <li><a href="group-order.php">Group Tray Order</a></li>
        <li><a href="schedule.php">Weekly Meal Planner</a></li>
        <li><a href="loyalty.php">Loyalty Points & Rewards</a></li>
      </ul>
    </div>

    <div>
      <h4 class="footer-title">Campus Stalls</h4>
      <ul class="footer-links">
        <li><a href="menu.php?shop_id=1">Campus Kitchen (Stall #01)</a></li>
        <li><a href="menu.php?shop_id=2">Bhojon Bilash (Stall #02)</a></li>
        <li><a href="menu.php?shop_id=3">Varsity Bites (Stall #03)</a></li>
        <li><a href="menu.php?shop_id=4">Fresh Sip Juice (Stall #04)</a></li>
        <li><a href="menu.php?shop_id=5">The Chai Break (Stall #05)</a></li>
      </ul>
    </div>

    <div>
      <h4 class="footer-title">Quick Role Access</h4>
      <p style="font-size:0.85rem; margin-bottom:0.75rem;">One-click demo credentials available for faculty inspection:</p>
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <a href="login.php?demo=student" class="btn btn-secondary btn-sm" style="background:#1e293b; color:#fff; border-color:#334155; justify-content:flex-start;">
          <i data-lucide="user" style="width:14px; height:14px; color:#34d399;"></i> Student: tanvir@campuseats.com
        </a>
        <a href="login.php?demo=kitchen" class="btn btn-secondary btn-sm" style="background:#1e293b; color:#fff; border-color:#334155; justify-content:flex-start;">
          <i data-lucide="chef-hat" style="width:14px; height:14px; color:#fbbf24;"></i> Kitchen: kitchen@campuseats.com
        </a>
        <a href="login.php?demo=admin" class="btn btn-secondary btn-sm" style="background:#1e293b; color:#fff; border-color:#334155; justify-content:flex-start;">
          <i data-lucide="shield" style="width:14px; height:14px; color:#c084fc;"></i> Admin: admin@campuseats.com
        </a>
      </div>
    </div>
  </div>

  <div class="container footer-bottom">
    <p>&copy; <?= date('Y') ?> CampusEats System – University CSE Full-Stack Project. All rights reserved.</p>
  </div>
</footer>

<!-- Initialize Lucide Icons -->
<script>
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
<!-- Client-side Interactions -->
<script src="js/main.js"></script>
</body>
</html>
