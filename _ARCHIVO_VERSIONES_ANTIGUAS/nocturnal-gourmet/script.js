/* ============================================
   THE NOCTURNAL GOURMET — Interactive Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Cart State ───
  let cartItems = [];

  // ─── DOM Elements ───
  const navbar     = document.getElementById('navbar');
  const navToggle  = document.getElementById('navToggle');
  const navLinks   = document.getElementById('navLinks');
  const cartCount  = document.getElementById('cartCount');
  const addButtons = document.querySelectorAll('.btn-add');

  // ─── Navbar scroll effect ───
  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Mobile menu toggle ───
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ─── Smooth scroll for anchor links ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Add to Cart ───
  function updateCartUI() {
    const total = cartItems.length;
    cartCount.textContent = total;
    if (total > 0) {
      cartCount.classList.add('visible');
    } else {
      cartCount.classList.remove('visible');
    }
  }

  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.item;
      const price = parseFloat(btn.dataset.price);

      // Add to cart
      cartItems.push({ item, price });
      updateCartUI();

      // Visual feedback
      btn.classList.add('added');
      const icon = btn.querySelector('.material-icons-outlined');
      icon.textContent = 'check';

      // Animate cart count
      cartCount.style.transform = 'scale(1.3)';
      setTimeout(() => {
        cartCount.style.transform = 'scale(1)';
      }, 200);

      // Reset button after delay
      setTimeout(() => {
        btn.classList.remove('added');
        icon.textContent = 'add';
      }, 1500);
    });
  });

  // ─── Scroll Reveal (IntersectionObserver) ───
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ─── Hero image parallax-lite on mouse move ───
  const heroImg = document.getElementById('heroImg');
  const hero = document.getElementById('hero');

  if (heroImg && hero && window.innerWidth > 768) {
    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroImg.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });

    hero.addEventListener('mouseleave', () => {
      heroImg.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      heroImg.style.transition = 'transform 0.5s ease-out';
      setTimeout(() => { heroImg.style.transition = ''; }, 500);
    });
  }

});
