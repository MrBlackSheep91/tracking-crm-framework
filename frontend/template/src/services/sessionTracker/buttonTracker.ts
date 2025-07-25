import { trackEvent } from './sessionManager';

interface ButtonData {
  elementId?: string;
  elementClass?: string;
  elementTag: string;
  elementText?: string;
  elementHref?: string;
  actionType: string;
  category?: string;
  position: { x: number, y: number };
  isExitLink: boolean;
  parentSection?: string;
  targetUrl?: string;
  visibleTime?: number;
}

const visibilityMap = new Map<string, number>();
let observerInitialized = false;
const interactionObserver = new IntersectionObserver(handleElementVisibility, {
  threshold: [0.5],
  rootMargin: '0px'
});

/**
 * Inicializa el tracking de botones y elementos interactivos
 */
export function initButtonTracking(): () => void {
  // Evitar inicialización múltiple
  if (document.querySelector('[data-button-tracking="active"]')) {
    return () => {}; // Return empty cleanup function
  }

  const marker = document.createElement('meta');
  marker.setAttribute('data-button-tracking', 'active');
  document.head.appendChild(marker);
  
  // Capturar todos los clicks en la página (delegación de eventos)
  document.addEventListener('click', handleButtonClick);
  
  // Monitorear formularios para capturar envíos
  document.addEventListener('submit', handleFormSubmit);
  
  // Capturar cuando el cursor entra a un elemento interactivo
  document.addEventListener('mouseover', handleElementHover);
  
  // Inicializar observador de visibilidad si no está activo
  if (!observerInitialized) {
    observeActionableElements();
    observerInitialized = true;
    // Re-observar cuando el DOM cambie
    const observer = new MutationObserver(throttle((_: MutationRecord[]) => {
      observeActionableElements();
    }, 2000) as MutationCallback);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Retornar función de limpieza
  return () => {
    document.removeEventListener('click', handleButtonClick);
    document.removeEventListener('submit', handleFormSubmit);
    document.removeEventListener('mouseover', handleElementHover);
    document.querySelectorAll('[data-button-tracking]').forEach(el => el.remove());
    interactionObserver.disconnect();
    observerInitialized = false;
  };
}

/**
 * Identifica y comienza a observar todos los elementos accionables en la página
 */
function observeActionableElements(): void {
  // Selector para todos los elementos interactivos
  const interactiveSelector = 'button, a, input[type="button"], input[type="submit"], [role="button"], [data-track]';
  
  // Obtener todos los elementos interactivos
  const elements = document.querySelectorAll(interactiveSelector);
  
  // Comenzar a observarlos
  elements.forEach(el => {
    // Solo observar si no está ya siendo observado
    if (!el.hasAttribute('data-tracking-observed')) {
      el.setAttribute('data-tracking-observed', 'true');
      interactionObserver.observe(el);
      
      // Registrar el tiempo inicial cuando el elemento se vuelve observable
      const uniqueId = getElementUniqueId(el);
      if (!visibilityMap.has(uniqueId)) {
        visibilityMap.set(uniqueId, 0);
      }
    }
  });
}

/**
 * Maneja la visibilidad de elementos para seguimiento de tiempo visible
 */
function handleElementVisibility(entries: IntersectionObserverEntry[]): void {
  entries.forEach(entry => {
    const element = entry.target as HTMLElement;
    const uniqueId = getElementUniqueId(element);
    
    if (entry.isIntersecting) {
      // El elemento acaba de hacerse visible
      (element as HTMLElement).dataset.visibleSince = Date.now().toString();
    } else if ((element as HTMLElement).dataset.visibleSince) {
      // El elemento acaba de dejar de ser visible
      const visibleTime = Date.now() - parseInt((element as HTMLElement).dataset.visibleSince || '0', 10);
      const currentTotal = visibilityMap.get(uniqueId) || 0;
      visibilityMap.set(uniqueId, currentTotal + visibleTime);
      delete (element as HTMLElement).dataset.visibleSince;
    }
  });
}

/**
 * Genera un ID único para un elemento
 */
function getElementUniqueId(element: Element): string {
  if (element.id) {
    return `id:${element.id}`;
  }
  
  // Crear un identificador basado en la posición DOM y contenido
  const path = getDomPath(element);
  const text = element.textContent?.slice(0, 20).trim() || '';
  return `${path}-${text}`;
}

/**
 * Genera una ruta DOM para el elemento
 */
function getDomPath(el: Element): string {
  const stack: string[] = [];
  while (el.parentNode !== null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < el.parentNode.childNodes.length; i++) {
      const sib = el.parentNode.childNodes[i];
      if (sib.nodeName === el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    
    const tagName = el.nodeName.toLowerCase();
    const pathIndex = sibCount > 1 ? `${tagName}:eq(${sibIndex})` : tagName;
    stack.unshift(pathIndex);
    el = el.parentNode as Element;
    
    if (stack.length > 5) break; // Limitar profundidad
  }
  
  return stack.slice(0, 5).join(' > ');
}

/**
 * Procesa un click en un botón o elemento interactivo
 */
function handleButtonClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const actionTarget = findInteractiveParent(target);
  
  if (!actionTarget) return;
  
  const buttonData = extractButtonData(actionTarget, e, 'click');
  
  // Añadir información de tiempo visible
  const uniqueId = getElementUniqueId(actionTarget);
  const storedVisibleTime = visibilityMap.get(uniqueId) || 0;
  let currentVisibleTime = 0;
  
  if ((actionTarget as HTMLElement).dataset.visibleSince) {
    currentVisibleTime = Date.now() - parseInt((actionTarget as HTMLElement).dataset.visibleSince || '0', 10);
  }
  
  buttonData.visibleTime = storedVisibleTime + currentVisibleTime;
  
  // Rastrear el evento
  trackEvent('user_interaction', 'button_click', {
    ...buttonData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Procesa envíos de formulario
 */
function handleFormSubmit(e: SubmitEvent): void {
  const form = e.target as HTMLFormElement;
  const submitButton = document.activeElement as HTMLElement;
  
  // Obtener todos los detalles del formulario
  const formDetails = {
    formId: form.id || 'form_' + getElementUniqueId(form),
    formAction: form.action || window.location.href,
    formMethod: form.method || 'get'
  };
  
  // Analizar campos para detectar campos vacíos o inválidos
  const formFields = Array.from(form.elements).filter(
    el => el instanceof HTMLInputElement || 
          el instanceof HTMLTextAreaElement || 
          el instanceof HTMLSelectElement
  );
  
  // Detectar campos vacíos o inválidos
  const emptyRequiredFields = formFields.filter(el => {
    const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Comprobar si es requerido y está vacío
    return input.hasAttribute('required') && 
           (input.value === '' || 
            (input instanceof HTMLInputElement && 
             input.type === 'email' && 
             !input.value.includes('@')));
  });

  // Crear resumen de estado del formulario
  const fieldsSummary = {
    totalFields: formFields.length,
    emptyRequiredCount: emptyRequiredFields.length,
    emptyRequiredFields: emptyRequiredFields.map(el => (el as HTMLInputElement).name || 'unnamed'),
    isValid: form.checkValidity(),
    willSubmit: form.checkValidity() && emptyRequiredFields.length === 0
  };
  
  // Datos del botón de envío
  const buttonData = submitButton && submitButton.tagName !== 'BODY' ? 
                    extractButtonData(submitButton, new MouseEvent('click'), 'form_submit') : 
                    {};
  
  // Eventos especiales: detección de conversiones
  const isLeadForm = form.classList.contains('lead-form') || 
                    form.getAttribute('data-form-type') === 'lead' ||
                    form.querySelector('input[name="email"]') !== null;
  
  const conversionType = form.getAttribute('data-conversion-type') || 
                        (isLeadForm ? 'lead_capture' : 'form_submission');

  const formDestination = form.getAttribute('data-success-redirect') || form.action;
  
  // Crear un ID único para este intento de conversión
  const attemptId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Preparar datos de tracking
  const trackingData = {
    ...buttonData,
    form: formDetails,
    fields: fieldsSummary,
    conversionType,
    isLeadForm,
    formDestination,
    conversionAttempt: {
      type: conversionType,
      willSucceed: fieldsSummary.willSubmit,
      attemptId: attemptId
    },
    eventId: `form_${attemptId}`,
    elementId: (buttonData as any).elementId || form.id || null,
    pageUrl: window.location.href,
    pageTitle: document.title,
    timestamp: Date.now()
  };
  
  // Almacenar datos en sessionStorage para que leadService pueda acceder a ellos
  try {
    window.sessionStorage.setItem('lastFormTrackingEvent', JSON.stringify(trackingData));
  } catch (err) {
    console.error('Error guardando datos de tracking en sessionStorage:', err);
  }
  
  // Rastrear el evento con datos mejorados
  trackEvent('user_interaction', 'form_submit', trackingData);
}

/**
 * Procesa eventos de hover en elementos interactivos
 */
function handleElementHover(e: MouseEvent): void {
  // Aplicar throttling para no generar demasiados eventos
  if (!shouldTrackHover()) return;
  
  const target = e.target as HTMLElement;
  const actionTarget = findInteractiveParent(target);
  
  if (!actionTarget) return;
  
  const buttonData = extractButtonData(actionTarget, e, 'hover');
  
  // Solo rastrear hover para elementos importantes (navegación, CTA)
  const isImportant = isImportantElement(actionTarget);
  if (!isImportant) return;
  
  // Rastrear el evento
  trackEvent('user_interaction', 'element_hover', buttonData);
}

/**
 * Determina si un elemento es importante para rastreo de hover
 */
function isImportantElement(el: Element): boolean {
  // Navegación principal
  if (el.closest('nav, header')) return true;
  
  // Botones CTA (Call to Action)
  if (el.classList.contains('cta') || 
      el.classList.contains('btn-primary') || 
      el.getAttribute('data-track-important') === 'true') {
    return true;
  }
  
  // Enlaces grandes o botones destacados
  if ((el.tagName === 'A' || el.tagName === 'BUTTON') && 
      (el.getBoundingClientRect().width > 150 || el.getBoundingClientRect().height > 40)) {
    return true;
  }
  
  return false;
}

/**
 * Extrae datos completos de un elemento interactivo
 */
function extractButtonData(element: Element, event: MouseEvent, actionType: string): ButtonData {
  // Extraer datos básicos del elemento
  const elementTag = element.tagName.toLowerCase();
  const elementId = element.id || undefined;
  const elementClass = element.className || undefined;
  const elementText = element.textContent?.trim() || undefined;
  
  // Extraer href si es un enlace
  let elementHref: string | undefined = undefined;
  let isExitLink = false;
  let targetUrl: string | undefined = undefined;
  
  if (elementTag === 'a') {
    const anchor = element as HTMLAnchorElement;
    elementHref = anchor.href || undefined;
    
    if (elementHref) {
      try {
        const currentDomain = window.location.hostname;
        const targetDomain = new URL(elementHref).hostname;
        isExitLink = targetDomain !== currentDomain && targetDomain !== '';
        targetUrl = elementHref;
      } catch (e) {
        // URL inválida o relativa
        isExitLink = false;
      }
    }
  }
  
  // Determinar la sección padre
  const parentSection = determineParentSection(element);
  
  // Obtener datos de data-attributes
  const category = element.getAttribute('data-track-category') || 
                  determineCategory(element) || 
                  '';
  
  // Crear el objeto completo de datos de botón
  return {
    elementId,
    elementClass,
    elementTag,
    elementText,
    elementHref,
    actionType,
    category,
    position: { x: event.clientX, y: event.clientY },
    isExitLink,
    parentSection,
    targetUrl
  };
}

/**
 * Determina la categoría de un elemento
 */
function determineCategory(element: Element): string | undefined {
  // Botones de navegación
  if (element.closest('nav, .nav, .navigation, .menu')) {
    return 'navigation';
  }
  
  // Botones de formulario
  if (element.closest('form') || element.tagName === 'FORM') {
    return 'form';
  }
  
  // Botones de CTA
  if (element.classList.contains('cta') || 
      element.classList.contains('btn-primary') || 
      element.classList.contains('button-primary')) {
    return 'cta';
  }
  
  // Enlaces de salida
  if (element.tagName === 'A') {
    const href = (element as HTMLAnchorElement).href;
    if (href && !href.startsWith(window.location.origin) && !href.startsWith('/')) {
      return 'exit_link';
    }
  }
  
  return undefined;
}

/**
 * Determina la sección padre de un elemento
 */
function determineParentSection(element: Element): string | undefined {
  // Verificar secciones comunes
  const sections = [
    { selector: 'header, .header', name: 'header' },
    { selector: 'nav, .nav, .navigation', name: 'navigation' },
    { selector: 'main, .main-content, [role="main"]', name: 'main_content' },
    { selector: 'aside, .sidebar', name: 'sidebar' },
    { selector: 'footer, .footer', name: 'footer' },
    { selector: '.hero, .banner', name: 'hero' },
    { selector: '.cta-section', name: 'cta_section' },
    { selector: '.products, .product-list', name: 'products' },
    { selector: '.testimonials', name: 'testimonials' },
    { selector: '.features', name: 'features' },
    { selector: '.blog, .articles', name: 'blog' },
    { selector: '.contact, .contact-form', name: 'contact' },
  ];
  
  for (const section of sections) {
    if (element.closest(section.selector)) {
      return section.name;
    }
  }
  
  // Verificar atributos data- personalizados
  const sectionAttr = element.closest('[data-section]');
  if (sectionAttr) {
    return sectionAttr.getAttribute('data-section') || undefined;
  }
  
  return undefined;
}

/**
 * Encuentra el padre interactivo más cercano
 */
function findInteractiveParent(element: HTMLElement): Element | null {
  // Si el elemento mismo es interactivo, devolverlo
  if (isInteractiveElement(element)) {
    return element;
  }
  
  // Buscar el padre interactivo más cercano
  let currentElement: HTMLElement | null = element;
  while (currentElement && currentElement !== document.body) {
    if (isInteractiveElement(currentElement)) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  
  return null;
}

/**
 * Verifica si un elemento es interactivo
 */
function isInteractiveElement(element: Element): boolean {
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  
  if (interactiveTags.includes(element.tagName)) {
    return true;
  }
  
  if (element.getAttribute('role') === 'button' || 
      element.getAttribute('tabindex') === '0' ||
      element.getAttribute('data-track') === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Throttle para eventos de hover
 */
let lastHoverTime = 0;
function shouldTrackHover(): boolean {
  const now = Date.now();
  if (now - lastHoverTime > 1000) { // 1 segundo entre eventos de hover
    lastHoverTime = now;
    return true;
  }
  return false;
}

/**
 * Helper de throttle
 */
function throttle(func: Function, delay: number): Function {
  let lastCall = 0;
  return function(...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
