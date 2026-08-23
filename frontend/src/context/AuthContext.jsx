/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

const AuthContext = createContext({ user: null });
export function AuthProvider({ children }) { return <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>; }
export const useAuth = () => useContext(AuthContext);
