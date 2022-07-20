import './App.less';

import React, { Suspense } from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';

import router from './router';

const App = () => (
  <div>
    <Suspense fallback={<div>loading</div>}>
      <Router>
        <div className="router">
          {router.map(({ path, info }) => {
            return (
              <NavLink
                style={({ isActive }) => {
                  return {
                    color: isActive ? 'aqua' : 'black',
                  };
                }}
                to={path as string}
                key={path}
              >
                {info}
              </NavLink>
            );
          })}
        </div>
        <Routes>
          {router.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          {/* <Route path="/" element={<Navigate to="/cavans" />} /> */}
        </Routes>
      </Router>
    </Suspense>
  </div>
);

export default App;
