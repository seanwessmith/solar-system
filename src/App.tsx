import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { SolarSystem } from "./solar/SolarSystem";

export function App() {
  return (
    <div className="app">
      <div className="logo-container">
        <img src={logo} alt="Bun Logo" className="logo bun-logo" />
        <img src={reactLogo} alt="React Logo" className="logo react-logo" />
      </div>

      <h1>Bun + React</h1>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
      <div style={{ marginTop: "1rem" }}>
        <h2>Solar System</h2>
        <SolarSystem width={900} height={600} />
      </div>
    </div>
  );
}

export default App;
