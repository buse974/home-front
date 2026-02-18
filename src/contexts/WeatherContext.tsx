import { createContext, useContext, useState, type ReactNode } from "react";

export type WeatherState = {
  weatherCode: number;
  isDay: boolean;
  enabled: boolean;
};

type WeatherContextType = {
  weatherState: WeatherState | null;
  setWeatherState: (state: WeatherState | null) => void;
};

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);

  return (
    <WeatherContext.Provider value={{ weatherState, setWeatherState }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within WeatherProvider");
  }
  return context;
}
