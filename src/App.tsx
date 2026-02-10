import { Switch } from './modules/Switch/Switch';

function App() {
  // Mock device pour le MVP
  const mockDevice = {
    id: '1',
    name: 'Salon',
    type: 'switch'
  };

  const handleCommand = async (command: string, params?: any) => {
    console.log('Command:', command, params);
    // TODO: Appeler l'API WebSocket
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Home Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Interface SaaS pour piloter vos installations domotiques
        </p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Switch device={mockDevice} onCommand={handleCommand} />
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400">
        <p>MVP - Architecture modulaire prête pour Jeedom, MQTT, Home Assistant</p>
      </footer>
    </div>
  );
}

export default App;
