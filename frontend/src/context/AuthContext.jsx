import { createContext, useState, useContext, useEffect } from "react";
import Cookie from "js-cookie";
import axios from "../api/axios";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuard, setIsGuard] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(true);

    //Revisa la sesión al recargar:
    const checkLogin = async () => {
        try {
            const res = await verifyTokenRequest();
            if (res.data) {
                setIsAuth(true);
                setUser(res.data);
                setLoading(false);
            }
        } catch (error) {
            setIsAuth(false);
            setLoading(false);
        }
    };

  const setRoles = (level) => {
    if (level === 1) {
      setIsGuard(true);
      setIsAdmin(false);
      console.log("Es guardia");
    } else if (level === 2) { 
      setIsAdmin(true);
      setIsGuard(false);
      console.log("Es admin");
    } else {
      setIsAdmin(false);
      setIsGuard(false);
      console.log("Es otro");
    }
  };

  const signin = async (data) => {
    try {
      const res = await axios.post("/signin", data);
      setUser(res.data);
      setRoles(res.data.level);
      setIsAuth(true);
      console.log(res.data.level);
      return res.data;
    } catch (error) {
      if (Array.isArray(error.response.data)) {
        return setErrors(error.response.data);
      }
      setErrors([error.response.data.message]);
    }
  };

  const signup = async (data) => {
    try {
      const res = await axios.post("/signup", data);
      setUser(res.data);
      setRoles(res.data.level);
      setIsAuth(true);
      return res.data;
    } catch (error) {
      if (Array.isArray(error.response.data)) {
        return setErrors(error.response.data);
      }
      setErrors([error.response.data.message]);
    }
  };

  const signout = async () => {
    await axios.post("/signout");
    setUser(null);
    setIsAuth(false);
    setIsAdmin(false);
    setIsGuard(false);
  };

    useEffect(() => {
        const verifySession = async () => {
            const token = Cookie.get("token");

            if (!token) {
                setIsAuth(false);
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get("/profile");
                setUser(res.data);
                setRoles(res.data.level);
                setIsAuth(true);
            } catch (error) {
                setUser(null);
                setIsAuth(false);
                setIsAdmin(false);
                setIsGuard(false);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

  useEffect(() => {
    const clean = setTimeout(() => {
      setErrors(null);
    }, 5000);
    return () => clearTimeout(clean);
  }, [errors]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth,
        isAdmin,
        isGuard,
        errors,
        signup,
        signin,
        signout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );


}
