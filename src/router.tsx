import { lazy } from 'react';
import { RouteObject } from 'react-router';

const Rect = lazy(() => import('@/components/rect'));
const ThreeJSDemo = lazy(() => import('@/components/threejs'));
interface IPropsR extends RouteObject {
  info: string;
}
const aaa: IPropsR[] = [
  {
    path: '/cavans',
    element: <Rect />,
    info: 'Cavans',
  },
  {
    path: '/three',
    element: <ThreeJSDemo />,
    info: 'ThreeJSDemo',
  },
];

export default aaa;
