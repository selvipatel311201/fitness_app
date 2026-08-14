import { useEffect, useState } from 'react';

export const ROUTES = ['home', 'how', 'exercises', 'faq', 'details', 'plan'] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_TITLES: Record<Route, string> = {
  home: 'FitPlan — Your plan, in two minutes',
  how: 'How it works — FitPlan',
  exercises: 'Exercise library — FitPlan',
  faq: 'Questions — FitPlan',
  details: 'Your details — FitPlan',
  plan: 'Your plan — FitPlan',
};

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as readonly string[]).includes(raw) ? (raw as Route) : 'home';
}

/**
 * Hash routing rather than paths: GitHub Pages serves static files, so a real
 * URL like /faq would 404 on refresh unless every route had its own file.
 */
export function useRoute(): [Route, (to: Route) => void] {
  const [route, setRoute] = useState<Route>(() => (typeof window === 'undefined' ? 'home' : parse()));

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    document.title = ROUTE_TITLES[route];
    window.scrollTo({ top: 0 });
  }, [route]);

  const navigate = (to: Route) => {
    if (parse() === to) return;
    window.location.hash = `#/${to}`;
  };

  return [route, navigate];
}
