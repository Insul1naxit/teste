document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a.nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('section.content-section[id]');
  const navUl = document.querySelector('nav ul');
  const menuToggle = document.querySelector('.menu-toggle');
  const navBar = document.getElementById('mainNav');
  let initialNavOffsetTop = 0;

  // Função para mostrar a seção e atualizar link ativo
  function showSection(targetId, isInitialLoad = false) {
    let sectionToShow = null;
    contentSections.forEach(section => {
      if (section.id === targetId.substring(1)) { // Remove o '#' do targetId
        section.classList.add('active-section');
        sectionToShow = section;
      } else {
        section.classList.remove('active-section');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current'); // Remover aria-current de todos
      if (link.getAttribute('href') === targetId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page'); // Adicionar ao link ativo
      }
    });

    if (!isInitialLoad && sectionToShow) {
      let scrollToPosition = sectionToShow.offsetTop;
      if (navBar.classList.contains('sticky')) {
         scrollToPosition -= navBar.offsetHeight;
      } else if (targetId === '#sobre' && navBar.offsetHeight > sectionToShow.offsetTop) {
         scrollToPosition = 0;
      } else {
        if (targetId === navLinks[0].getAttribute('href')) { 
             scrollToPosition -= initialNavOffsetTop > 0 ? initialNavOffsetTop : navBar.offsetHeight;
        } else { 
             scrollToPosition -= navBar.offsetHeight;
        }
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
    });
  }

  window.addEventListener('scroll', makeNavSticky);
  window.addEventListener('resize', () => {
    setInitialNavOffset();
    makeNavSticky();
  });
  window.addEventListener('load', () => {
    setInitialNavOffset();
    makeNavSticky();
  });
});