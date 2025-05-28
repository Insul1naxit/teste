document.addEventListener('DOMContentLoaded', () => {
  // --- UTILITIES ---
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- SELETORES GLOBAIS ---
  const navBar = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('nav a.nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('section.content-section[id]');
  const navUl = document.querySelector('nav ul.nav-links'); // Definido aqui para uso em closeMobileMenuIfNeeded
  const menuToggle = document.querySelector('.menu-toggle'); // Definido aqui

  // --- FUNÇÃO HELPER PARA FECHAR MENU MOBILE ---
  function closeMobileMenuIfNeeded() {
    if (window.innerWidth <= 600 && navUl && navUl.classList.contains('open') && menuToggle) {
      navUl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Menu';
    }
  }

  // --- INICIALIZAÇÃO DO MENU HAMBURGUER ---
  function initMenuToggle() {
    if (menuToggle && navUl) {
      menuToggle.addEventListener('click', () => {
        const isOpen = navUl.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen.toString());
        menuToggle.textContent = isOpen ? '✕ Fechar' : '☰ Menu';
      });

      window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 600 && navUl.classList.contains('open')) {
          navUl.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.textContent = '☰ Menu';
        }
      }, 200));
    }
  }

  // --- NAVEGAÇÃO E EXIBIÇÃO DE SEÇÕES ---
  let initialNavOffsetTop = 0;

  function showSection(targetId, isInitialLoad = false) {
    let sectionToShow = null;
    contentSections.forEach(section => {
      const isActiveSection = section.id === targetId.substring(1);
      section.classList.toggle('active-section', isActiveSection);
      if (isActiveSection) {
        sectionToShow = section;
        // Adiciona 'is-visible' para a primeira seção na carga se ela já estiver na viewport
        if (isInitialLoad) {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0 && !section.classList.contains('is-visible')) {
                 section.classList.add('is-visible');
            }
        }
      }
    });

    navLinks.forEach(link => {
      const isActiveLink = link.getAttribute('href') === targetId;
      link.classList.toggle('active', isActiveLink);
      link.setAttribute('aria-current', isActiveLink ? 'page' : 'false');
    });

    // Scroll para a seção
    // Condição específica para rolagem ao topo na carga inicial da primeira seção
    if (isInitialLoad && navLinks.length > 0 && targetId === navLinks[0].getAttribute('href')) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      closeMobileMenuIfNeeded();
      return; // Finaliza a função aqui para evitar outro scroll
    }

    // Scroll para outras seções ou cliques subsequentes
    if (sectionToShow) { // Verifica se sectionToShow não é null (importante se targetId for inválido)
      let scrollToPosition = sectionToShow.offsetTop;

      // Ajusta a posição de scroll considerando a altura da navbar (fixa ou não)
      if (navBar.classList.contains('sticky')) {
        scrollToPosition -= navBar.offsetHeight;
      } else {
        // Se a navbar não é sticky, mas está acima do topo da viewport (ex: após um scroll para baixo e depois clique)
        // E se o initialNavOffsetTop foi calculado corretamente
        // Esta lógica tenta evitar que o topo da seção fique escondido
        if (initialNavOffsetTop > 0 && window.pageYOffset < initialNavOffsetTop) {
             // Se estamos rolando para cima e a nav original ficaria visível
            scrollToPosition -= initialNavOffsetTop;
        } else if (navBar.offsetHeight > 0) { // Se a nav tem altura (não é display:none)
            scrollToPosition -= navBar.offsetHeight;
        }
      }
      
      // TESTE: Usar 'auto' no mobile para scroll, 'smooth' no desktop
      const scrollBehavior = window.innerWidth <= 600 ? 'auto' : 'smooth';

      window.scrollTo({
        top: Math.max(0, scrollToPosition - 15), // -15 para um pequeno offset visual
        behavior: scrollBehavior
      });
    }
    closeMobileMenuIfNeeded();
  }

  function initSectionNavigation() {
    if (navLinks.length > 0) {
      const firstSectionId = navLinks[0].getAttribute('href');
      showSection(firstSectionId, true);
    } else if (contentSections.length > 0) { // Fallback se não houver navLinks
      const firstSectionId = '#' + contentSections[0].id;
      showSection(firstSectionId, true);
    }

    navLinks.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        showSection(targetId, false); // isInitialLoad é false para cliques
      });
    });
  }

  // --- NAVEGAÇÃO FIXA (STICKY NAV) ---
  function setInitialNavOffset() {
    if (!navBar) return;
    const wasSticky = navBar.classList.contains('sticky');
    if (wasSticky) navBar.classList.remove('sticky');
    initialNavOffsetTop = navBar.offsetTop;
    if (wasSticky) navBar.classList.add('sticky');
  }

  function handleStickyNav() {
    if (!navBar) return;
    if (initialNavOffsetTop > 0 && window.pageYOffset > initialNavOffsetTop) {
      navBar.classList.add('sticky');
    } else {
      navBar.classList.remove('sticky');
    }
  }

  function initStickyNav() {
    if (!navBar) return;
    // Chama setInitialNavOffset no load e resize para garantir que o offset está correto
    // especialmente após o carregamento de todas as imagens e fontes.
    window.addEventListener('load', () => {
        setInitialNavOffset();
        handleStickyNav(); // Verifica o estado sticky no load
    });
    window.addEventListener('resize', debounce(() => {
      setInitialNavOffset();
      handleStickyNav();
    }, 200));
    window.addEventListener('scroll', debounce(handleStickyNav, 50));
  }

  // --- SLIDER DE IMAGENS ---
  function initImageSlider() {
    const slider = document.querySelector('.image-slider');
    const slides = Array.from(document.querySelectorAll('.image-slider img'));
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (!slider || slides.length === 0) return;

    let currentIndex = 0;
    let autoSlideInterval;

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        dot.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
        if (index === currentIndex) dot.classList.add('active');
        dot.addEventListener('click', () => {
          currentIndex = index;
          updateSlider();
          startAutoSlide();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateSlider() {
      slider.style.transform = `translateX(-${currentIndex * 100}%)`;
      slides.forEach((slide, index) => slide.classList.toggle('active', index === currentIndex));
      if (dotsContainer) {
        Array.from(dotsContainer.children).forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
      }
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlider();
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlider();
    }

    function startAutoSlide() {
      stopAutoSlide();
      if (slides.length > 1) {
        autoSlideInterval = setInterval(nextSlide, 4000);
      }
    }

    function stopAutoSlide() {
      clearInterval(autoSlideInterval);
    }

    createDots();
    updateSlider();

    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => { prevSlide(); startAutoSlide(); });
      nextButton.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
    }

    startAutoSlide();
    const sliderContainer = document.querySelector('.image-slider-container');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', stopAutoSlide);
      sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }
  }

  // --- ANIMAÇÃO DE SCROLL REVEAL PARA SEÇÕES ---
  function initScrollReveal() {
    const sectionsToReveal = document.querySelectorAll('.content-section');
    if (sectionsToReveal.length === 0) return;

    const revealObserverOptions = {
      threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // observer.unobserve(entry.target); // Descomente para animar apenas uma vez
        } else {
          // entry.target.classList.remove('is-visible'); // Descomente para re-animar
        }
      });
    }, revealObserverOptions);

    sectionsToReveal.forEach(section => {
      revealObserver.observe(section);
    });
  }


  // --- CHAMADA DAS FUNÇÕES DE INICIALIZAÇÃO ---
  initMenuToggle();
  initSectionNavigation();
  initStickyNav();
  initImageSlider();
  initScrollReveal();

});