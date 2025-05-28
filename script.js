document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a.nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('section.content-section[id]');
  const navUl = document.querySelector('nav ul.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');
  const navBar = document.getElementById('mainNav');
  let initialNavOffsetTop = 0;

  // --- Função para mostrar a seção e atualizar link ativo ---
  function showSection(targetId, isInitialLoad = false) {
    let sectionToShow = null;
    contentSections.forEach(section => {
      if (section.id === targetId.substring(1)) {
        section.classList.add('active-section');
        // A classe 'is-visible' será adicionada pelo IntersectionObserver
        // mas podemos forçar para a primeira seção no carregamento se ela já estiver visível
        if (isInitialLoad) {
            // Força a primeira seção a ser "visível" para animação imediata se necessário
            // O IntersectionObserver também vai pegá-la, mas isso garante
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                 section.classList.add('is-visible');
            }
        }
        sectionToShow = section;
      } else {
        section.classList.remove('active-section');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      if (link.getAttribute('href') === targetId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
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

    if (window.innerWidth <= 600 && navUl.classList.contains('open')) {
      navUl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Menu';
    }
  }

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

  function setInitialNavOffset() {
    const wasSticky = navBar.classList.contains('sticky');
    if (wasSticky) navBar.classList.remove('sticky');
    initialNavOffsetTop = navBar.offsetTop;
    if (wasSticky) navBar.classList.add('sticky');
  }

  function makeNavSticky() {
    if (initialNavOffsetTop > 0 && window.pageYOffset > initialNavOffsetTop) {
      navBar.classList.add('sticky');
    } else {
      navBar.classList.remove('sticky');
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navUl.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen.toString());
      if (isOpen) {
        menuToggle.textContent = '✕ Fechar';
      } else {
        menuToggle.textContent = '☰ Menu';
      }
    });
  }

  // --- SLIDER DE IMAGENS COM DOTS ---
  const slider = document.querySelector('.image-slider');
  const slides = Array.from(document.querySelectorAll('.image-slider img'));
  const prevButton = document.querySelector('.slider-button.prev');
  const nextButton = document.querySelector('.slider-button.next');
  const dotsContainer = document.querySelector('.slider-dots');
  let currentIndex = 0;
  let autoSlideInterval;

  function createDots() {
    if (!dotsContainer || slides.length === 0) return;
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('dot');
      dot.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
      if (index === currentIndex) {
        dot.classList.add('active');
      }
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateSlider();
        startAutoSlide();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateSlider() {
    if (slider) {
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentIndex);
    });
    if (dotsContainer) {
        Array.from(dotsContainer.children).forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
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

  if (slides.length > 0) {
    createDots();
    updateSlider();

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
    startAutoSlide();
    const sliderContainer = document.querySelector('.image-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }
  }

  window.addEventListener('scroll', makeNavSticky);
  window.addEventListener('resize', () => {
    setInitialNavOffset();
    makeNavSticky();
    if (window.innerWidth > 600 && navUl.classList.contains('open')) {
      navUl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Menu';
    }
  });

  window.addEventListener('load', () => {
    setInitialNavOffset();
    makeNavSticky();
    if (slides.length > 0) {
        updateSlider();
    }
    // Força a primeira seção a ter a classe .is-visible se ela já estiver na viewport no carregamento
    // Isso é um complemento ao showSection para garantir a animação inicial correta.
    const firstActiveSection = document.querySelector('.content-section.active-section');
    if (firstActiveSection) {
        const rect = firstActiveSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
            firstActiveSection.classList.add('is-visible');
        }
    }
  });

  // --- SCROLL REVEAL PARA SEÇÕES ---
  const sectionsToReveal = document.querySelectorAll('.content-section');
  const revealObserverOptions = {
    threshold: 0.1 // Anima quando 10% da seção está visível
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Opcional: parar de observar depois que a animação ocorreu uma vez
        // observer.unobserve(entry.target);
      } else {
        // Opcional: remover a classe se quiser que a animação ocorra toda vez que entra/sai da viewport
        // (pode ser um pouco "agitado" para seções inteiras, mas é uma opção)
        // entry.target.classList.remove('is-visible');
      }
    });
  }, revealObserverOptions);

  sectionsToReveal.forEach(section => {
    revealObserver.observe(section);
  });

});