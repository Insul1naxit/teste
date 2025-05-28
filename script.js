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
  const navUl = document.querySelector('nav ul.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');

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
  let initialNavOffsetTop = 0; // Ainda pode ser usado mesmo sem sticky nav para cálculos de scroll

  function showSection(targetId, isInitialLoad = false) {
    let sectionToShow = null;
    contentSections.forEach(section => {
      const isActiveSection = section.id === targetId.substring(1);
      section.classList.toggle('active-section', isActiveSection);
      if (isActiveSection) {
        sectionToShow = section;
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

    if (isInitialLoad && navLinks.length > 0 && targetId === navLinks[0].getAttribute('href')) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      closeMobileMenuIfNeeded();
      return;
    }

    if (sectionToShow) {
      let scrollToPosition = sectionToShow.offsetTop;
      
      // Se a navegação fixa estiver desabilitada, não precisamos subtrair sua altura,
      // A menos que a nav ainda ocupe espaço no topo (se não for 'fixed')
      // Vamos assumir que sem 'sticky', a nav não está 'fixed' e faz parte do fluxo normal.
      // Se a navBar ainda tem uma altura e está no fluxo, precisamos considerar seu offset original.
      // Ou, se a navBar tiver position:absolute ou similar, a lógica precisaria mudar.
      // Para este teste, vamos simplificar e apenas rolar para o offsetTop da seção.
      // Se a navBar ainda ocupar espaço no topo (sem ser fixed), talvez precise subtrair
      // navBar.offsetHeight ou initialNavOffsetTop (se initialNavOffsetTop for o topo da nav).
      // Por enquanto, vamos testar sem subtrair nada, assumindo que a nav não está mais 'fixed'.

      // Se a barra de navegação não é mais fixa, a altura dela não deve ser subtraída
      // a menos que ela esteja sobrepondo o conteúdo de alguma outra forma.
      // Com a stickyNav desabilitada, a navBar não terá a classe 'sticky'.
      // No entanto, o cálculo de `initialNavOffsetTop` ainda existe.
      // Se a navBar não for sticky, ela está no fluxo do documento. O `offsetTop` da seção já é relativo a isso.
      // A única questão é se queremos um espaço extra abaixo da nav (que agora está no fluxo).

      // Simplificando para o teste:
      // scrollToPosition = sectionToShow.offsetTop; // Rola diretamente para o topo da seção
      // Se a nav está no fluxo e queremos a seção ABAIXO da nav:
      if (navBar) { // Se a navBar existir
          // Se a nav não for sticky, ela ocupa espaço. Se initialNavOffsetTop for o topo da nav,
          // e a nav tiver altura, subtrair essa altura fará com que o topo da seção fique abaixo da nav.
          // Isso assume que navBar.offsetTop é 0 quando não é sticky e está no topo.
          // Se a nav estiver sempre visível no topo (mesmo não sticky), subtrair sua altura.
           if (!navBar.classList.contains('sticky')) { // Embora tenhamos comentado initStickyNav, verificamos
               scrollToPosition -= navBar.offsetHeight; // Ou use initialNavOffsetTop se ele representar a altura + posição
           }
      }


      const scrollBehavior = window.innerWidth <= 600 ? 'auto' : 'smooth';
      window.scrollTo({
        top: Math.max(0, scrollToPosition - 15), // o -15 é um pequeno offset
        behavior: scrollBehavior
      });
    }
    closeMobileMenuIfNeeded();
  }

  function initSectionNavigation() {
    if (navLinks.length > 0) {
      // Calcula initialNavOffsetTop uma vez aqui se stickyNav estiver desabilitado
      // para ter uma referência da posição da nav.
      if (navBar && typeof initStickyNav === 'undefined') { // Verifica se initStickyNav foi comentada
         initialNavOffsetTop = navBar.offsetTop;
      }
      const firstSectionId = navLinks[0].getAttribute('href');
      showSection(firstSectionId, true);
    } else if (contentSections.length > 0) {
      const firstSectionId = '#' + contentSections[0].id;
      showSection(firstSectionId, true);
    }

    navLinks.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        showSection(targetId, false);
      });
    });
  }

  /*
  // --- NAVEGAÇÃO FIXA (STICKY NAV) --- // COMENTADA PARA TESTE
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
    window.addEventListener('load', () => {
        setInitialNavOffset();
        handleStickyNav();
    });
    window.addEventListener('resize', debounce(() => {
      setInitialNavOffset();
      handleStickyNav();
    }, 200));
    window.addEventListener('scroll', debounce(handleStickyNav, 50));
  }
  */

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
  function initScrollReveal() { // Mantenha esta função, mas a chamada dela pode estar comentada
    const sectionsToReveal = document.querySelectorAll('.content-section');
    if (sectionsToReveal.length === 0) return;

    const revealObserverOptions = {
      threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // observer.unobserve(entry.target);
        } else {
          // entry.target.classList.remove('is-visible');
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
  // initStickyNav(); // <--- DESABILITADO PARA ESTE TESTE
  initImageSlider();
  // initScrollReveal(); // <--- MANTENHA COMENTADO SE O TESTE ANTERIOR INDICOU PROBLEMA, OU DESCOMENTE

  window.addEventListener('load', () => {
    // Recalcula initialNavOffsetTop aqui, mesmo se stickyNav estiver desabilitado,
    // para que showSection possa usá-lo se a nav estiver no fluxo.
    if (navBar) {
        initialNavOffsetTop = navBar.offsetTop;
    }

    const firstActiveSection = document.querySelector('.content-section.active-section');
    if (firstActiveSection) {
        const rect = firstActiveSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0 && !firstActiveSection.classList.contains('is-visible')) {
            firstActiveSection.classList.add('is-visible');
        }
    }
  });

});