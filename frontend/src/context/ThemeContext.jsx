/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light") }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
