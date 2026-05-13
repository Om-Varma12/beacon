import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HackathonTable from './components/HackathonTable';
import Individual from './pages/Individual';
import HackathonDetailApi from './pages/HackathonDetailApi';
import { NavbarProvider } from './context/NavbarContext';

function App() {
  return (
    <NavbarProvider>
      <div className="mosaic-bg" />
      <div className="relative z-10 min-h-screen bg-mosaic text-forest">
        <Navigation />
        <Routes>
          <Route path="/" element={<HackathonTable />} />
          <Route path="/individual" element={<Individual />} />
          <Route path="/hackathon/:id" element={<HackathonDetailApi />} />
        </Routes>
      </div>
    </NavbarProvider>
  );
}

export default App;
