document.addEventListener('DOMContentLoaded', () => {
  // --- UTILITIES ---
  /**
   * Debounce function: Limita a taxa na qual uma função pode ser disparada.
   * @param {Function} func - A função a ser debounced.
   * @param {number} delay - O atraso em milissegundos.
   * @returns {Function} - A nova função debounced.
   */
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- SELETORES GLOBAIS USADOS POR MÚLTIPLAS FUNÇÕES ---
  const navBar = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('nav a.nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('section.content-section[id]');

  // --- INICIALIZAÇÃO DO MENU HAMBURGUER ---
  function initMenuToggle() {
    const navUl = document.querySelector('nav ul.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');

    if (menuToggle && navUl) {
      menuToggle.addEventListener('click', () => {
        const isOpen = navUl.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen.toString());
        menuToggle.textContent = isOpen ? '✕ Fechar' : '☰ Menu';
      });

      // Fechar menu se redimensionar para tela maior com menu aberto
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
  let initialNavOffsetTop = 0; // Variável para a navegação fixa

  function showSection(targetId, isInitialLoad = false) {
    let sectionToShow = null;
    contentSections.forEach(section => {
      const isActiveSection = section.id === targetId.substring(1);
      section.classList.toggle('active-section', isActiveSection);
      if (isActiveSection) {
        sectionToShow = section;
        // Lógica para .is-visible já é tratada pelo IntersectionObserver do scrollReveal
        // Mas para a primeira carga, se a seção já estiver visível, adicionamos a classe
        if (isInitialLoad) {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
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

    if (!isInitialLoad && sectionToShow) {
      let scrollToPosition = sectionToShow.offsetTop;
      if (navBar.classList.contains('sticky')) {
        scrollToPosition -= navBar.offsetHeight;
      } else if (targetId === '#sobre' && navBar.offsetHeight > sectionToShow.offsetTop) {
         scrollToPosition = 0;
      } else {
        const navHeightToSubtract = initialNavOffsetTop > 0 && window.pageYOffset < initialNavOffsetTop ? initialNavOffsetTop : navBar.offsetHeight;
        scrollToPosition -= navHeightToSubtract;
      }
      window.scrollTo({
        top: Math.max(0, scrollToPosition - 15),
        behavior: 'smooth'
      });
    } else if (isInitialLoad && targetId === '#sobre') {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    // Fecha o menu hamburguer se estiver aberto (em telas pequenas) após clicar em um link
    const navUl = document.querySelector('nav ul.nav-links'); // Precisa re-selecionar ou passar como parâmetro
    const menuToggle = document.querySelector('.menu-toggle'); // Precisa re-selecionar ou passar como parâmetro
    if (window.innerWidth <= 600 && navUl && navUl.classList.contains('open') && menuToggle) {
      navUl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Menu';
    }
  }

  function initSectionNavigation() {
    if (navLinks.length > 0) {
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
        showSection(targetId);
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
    setInitialNavOffset(); // Define o offset inicial
    window.addEventListener('scroll', debounce(handleStickyNav, 50)); // Debounce no scroll
    window.addEventListener('resize', debounce(() => { // Debounce no resize
      setInitialNavOffset();
      handleStickyNav();
    }, 200));
    window.addEventListener('load', () => { // Garante que está correto no load
        setInitialNavOffset();
        handleStickyNav();
    });
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
          startAutoSlide(); // Reinicia o timer ao clicar no dot
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
    updateSlider(); // Mostra o primeiro slide e dot ativo

    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => {
        prevSlide();
        startAutoSlide();
      });
      nextButton.addEventListener('click', () => {
        nextSlide();
        startAutoSlide();
      });
    }

    startAutoSlide(); // Inicia o autoslide

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
      threshold: 0.1 // Anima quando 10% da seção está visível
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
  initSectionNavigation(); // Deve vir antes de initStickyNav se showSection ajusta scroll para sticky
  initStickyNav();
  initImageSlider();
  initScrollReveal();

  // Garante que a primeira seção visível no load também tenha a classe .is-visible
  // Essa lógica foi movida para dentro de showSection e para o evento de 'load' do initStickyNav
  // para melhor coordenação, mas aqui está uma verificação final no load:
   window.addEventListener('load', () => {
    const firstActiveSection = document.querySelector('.content-section.active-section');
    if (firstActiveSection) {
        const rect = firstActiveSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0 && !firstActiveSection.classList.contains('is-visible')) {
            firstActiveSection.classList.add('is-visible');
        }
    }
  });

});