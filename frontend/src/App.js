import React, { Suspense } from 'react';
import FlowApp from './flow/FlowApp';

const LegacyApp = React.lazy(() => import('./LegacyApp'));

export default function App() {
  return new URLSearchParams(window.location.search).get('legacy') === '1'
    ? <Suspense fallback={<p>Загрузка предыдущей версии…</p>}><LegacyApp /></Suspense>
    : <FlowApp />;
}
