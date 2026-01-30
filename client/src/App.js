import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProblemList from './pages/ProblemList';
import ProblemSolver from './pages/ProblemSolver';
import Statistics from './pages/Statistics';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <Routes>
        <Route path="/" element={<ProblemList />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemSolver />} />
        <Route path="/stats" element={<Statistics />} />
      </Routes>
    </div>
  );
}

export default App;