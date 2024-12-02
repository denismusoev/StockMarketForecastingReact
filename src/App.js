import React from 'react';
import ForecastForm from './ForecastForm';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
      <div className="App">
        <h1>Прогноз для акций, криптовалют и Forex</h1>
        <ForecastForm />
      </div>
  );
}

export default App;
