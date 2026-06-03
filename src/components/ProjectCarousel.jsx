import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { LuChevronLeft, LuChevronRight } from './Icons';

const MOBILE_MQ = '(max-width: 900px)';

const ProjectCarousel = ({ projects }) => {
  // Detecta mobile via matchMedia — sincronizado com breakpoint do CSS
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(null);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const viewportRef = useRef(null);
  const currentSlideRef = useRef(null);
  const incomingSlideRef = useRef(null);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) goPrev();
    else if (delta < -50) goNext();
    touchStartX.current = null;
  };

  // Listener de resize — reseta o carousel ao mudar de breakpoint
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const handler = (e) => {
      clearTimeout(timeoutRef.current);
      setIsMobile(e.matches);
      setCurrentIndex(0);
      setNextIndex(null);
      setDirection(null);
      setIsAnimating(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const itemsPerPage = isMobile ? 1 : 2;
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  // Smoothly animate viewport height when content changes
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (isAnimating && incomingSlideRef.current) {
      const incomingHeight = incomingSlideRef.current.offsetHeight;
      viewport.style.height = `${viewport.offsetHeight}px`;
      requestAnimationFrame(() => {
        viewport.style.height = `${incomingHeight}px`;
      });
    } else if (!isAnimating && currentSlideRef.current) {
      viewport.style.height = `${currentSlideRef.current.offsetHeight}px`;
      const onEnd = () => { viewport.style.height = ''; };
      viewport.addEventListener('transitionend', onEnd, { once: true });
      const fallback = setTimeout(onEnd, 800);
      return () => { clearTimeout(fallback); viewport.removeEventListener('transitionend', onEnd); };
    }
  }, [isAnimating, currentIndex, nextIndex]);

  const goTo = useCallback((newIndex, dir) => {
    if (isAnimating || newIndex === currentIndex) return;
    clearTimeout(timeoutRef.current);

    setNextIndex(newIndex);
    setDirection(dir);
    setIsAnimating(true);

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex(newIndex);
      setNextIndex(null);
      setDirection(null);
      setIsAnimating(false);
    }, 750);
  }, [isAnimating, currentIndex]);

  const goNext = () => goTo((currentIndex + 1) % totalPages, 'next');
  const goPrev = () => goTo((currentIndex - 1 + totalPages) % totalPages, 'prev');

  // Renderiza um card individual
  const renderCard = (project) => (
    <div className="project-card" key={project.name}>
      {project.image ? (
        <div className={`project-image-container ${project.imageClass || 'mobile'}`}>
          <img
            src={project.image}
            alt={project.alt}
            className="project-screenshot"
            width={800}
            height={550}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="project-image-placeholder" aria-hidden="true">
          EM BREVE
        </div>
      )}
      <div className="project-info">
        <h3 className="project-name">{project.name}</h3>
        <p className="project-desc">{project.desc}</p>
      </div>
    </div>
  );

  // Renderiza uma página com itemsPerPage cards
  const renderPage = (pageIndex) => {
    const start = pageIndex * itemsPerPage;
    const pageProjects = projects.slice(start, start + itemsPerPage);
    return (
      <div className="carousel-page">
        {pageProjects.map((project) => renderCard(project))}
      </div>
    );
  };

  return (
    <div className="carousel-wrapper">
      <button
        className="carousel-arrow carousel-arrow-left"
        onClick={goPrev}
        aria-label="Projeto anterior"
        disabled={isAnimating}
      >
        <LuChevronLeft size={28} />
      </button>

      <div className="carousel-viewport" ref={viewportRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Página atual (saindo) */}
        <div
          className={`carousel-slide carousel-current ${direction ? `carousel-out-${direction}` : ''}`}
          key={`current-${currentIndex}`}
          ref={currentSlideRef}
        >
          {renderPage(currentIndex)}
        </div>

        {/* Página entrando — clip-path reveal */}
        {nextIndex !== null && (
          <div
            className={`carousel-slide carousel-incoming carousel-in-${direction}`}
            key={`incoming-${nextIndex}`}
            ref={incomingSlideRef}
          >
            {renderPage(nextIndex)}
          </div>
        )}
      </div>

      <button
        className="carousel-arrow carousel-arrow-right"
        onClick={goNext}
        aria-label="Próximo projeto"
        disabled={isAnimating}
      >
        <LuChevronRight size={28} />
      </button>

      <div className="carousel-dots">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === currentIndex && !isAnimating ? 'active' : ''} ${i === nextIndex ? 'active incoming' : ''}`}
            onClick={() => goTo(i, i > currentIndex ? 'next' : 'prev')}
            aria-label={`Página ${i + 1}`}
            aria-current={i === currentIndex ? 'true' : undefined}
          />
        ))}
        <span className="carousel-counter">{(nextIndex ?? currentIndex) + 1} / {totalPages}</span>
      </div>
    </div>
  );
};

export default ProjectCarousel;
