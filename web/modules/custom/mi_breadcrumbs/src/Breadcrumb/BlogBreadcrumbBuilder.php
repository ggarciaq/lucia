<?php

namespace Drupal\mi_breadcrumbs\Breadcrumb;

use Drupal\Core\Breadcrumb\Breadcrumb;
use Drupal\Core\Breadcrumb\BreadcrumbBuilderInterface;
use Drupal\Core\Link;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Construye migas de pan dinámicas para nodos del tipo "blog".
 *
 * Detecta el origen de la navegación mediante el query param ?from=
 * (valores: "hemeroteca" o "cuaderno"). Si no hay parámetro, recupera
 * el último origen guardado en sesión; el valor por defecto es "hemeroteca".
 */
class BlogBreadcrumbBuilder implements BreadcrumbBuilderInterface {

  use StringTranslationTrait;

  /**
   * Path/alias del landing "Hemeroteca".
   */
  protected string $hemerotecaPath = '/hemeroteca';

  /**
   * Path/alias del landing "El Cuaderno".
   */
  protected string $cuadernoPath = '/el_cuaderno';

  /**
   * Clave de sesión donde se persiste el último origen.
   */
  protected string $sessionKey = 'mi_breadcrumbs_origin';

  /**
   * El servicio RequestStack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected RequestStack $requestStack;

  /**
   * Constructs a BlogBreadcrumbBuilder.
   *
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   El stack de peticiones HTTP.
   */
  public function __construct(RequestStack $request_stack) {
    $this->requestStack = $request_stack;
  }

  /**
   * {@inheritdoc}
   *
   * Solo aplica cuando la ruta actual corresponde a un nodo de tipo "blog".
   */
  public function applies(RouteMatchInterface $route_match) {
    $node = $route_match->getParameter('node');
    return $node instanceof NodeInterface && $node->bundle() === 'blog';
  }

  /**
   * {@inheritdoc}
   *
   * Construye la miga de pan con origen dinámico:
   *   Inicio / [Hemeroteca | El Cuaderno] / Título del nodo
   */
  public function build(RouteMatchInterface $route_match) {
    /** @var \Drupal\node\NodeInterface $node */
    $node = $route_match->getParameter('node');

    $breadcrumb = new Breadcrumb();

    // Varia por el param ?from= y por sesión para evitar caché cruzado entre usuarios.
    $breadcrumb->addCacheContexts(['url.query_args:from', 'session']);
    $breadcrumb->addCacheableDependency($node);

    // --- Resolver el origen ---
    $request = $this->requestStack->getCurrentRequest();
    $from = $request->query->get('from', '');
    $session = $request->getSession();

    $validOrigins = ['hemeroteca', 'cuaderno'];

    if (in_array($from, $validOrigins, TRUE)) {
      // Persistir en sesión solo si el valor es válido.
      $session->set($this->sessionKey, $from);
    }
    else {
      // Sin param: leer sesión o caer en el valor por defecto.
      $from = $session->get($this->sessionKey, 'hemeroteca');
    }

    // --- Primer crumb: Inicio ---
    $breadcrumb->addLink(Link::createFromRoute($this->t('Inicio'), '<front>'));

    // --- Segundo crumb: sección de origen ---
    if ($from === 'cuaderno') {
      $breadcrumb->addLink(Link::fromTextAndUrl(
        $this->t('El Cuaderno'),
        Url::fromUri('internal:' . $this->cuadernoPath)
      ));
    }
    else {
      // Hemeroteca es el destino por defecto.
      $breadcrumb->addLink(Link::fromTextAndUrl(
        $this->t('Hemeroteca'),
        Url::fromUri('internal:' . $this->hemerotecaPath)
      ));
    }

    // --- Tercer crumb: título del nodo actual (sin enlace) ---
    $breadcrumb->addLink(Link::fromTextAndUrl(
      $node->label(),
      Url::fromRoute('<none>')
    ));

    return $breadcrumb;
  }

}
