import Navigation from './components/Navigation';
import HackathonTable from './components/HackathonTable';
import { NavbarProvider } from './context/NavbarContext';

function App() {
  return (
    <NavbarProvider>
      <div className="mosaic-bg" />
      <div className="relative z-10 min-h-screen bg-mosaic text-forest">
        <Navigation />
        <HackathonTable />
      </div>
    </NavbarProvider>
  );
}

export default App;
