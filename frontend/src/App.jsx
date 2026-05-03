import { Routes, Route, Outlet } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { useState } from "react";
import { ColorModeContext, useMode } from "../theme"
import { TaskProvider } from "./context/TaskContext";
import { UserProvider } from "./context/UserContext";
import { DataProvider } from "./context/DataContext";
import Topbar from "./components/navbar/Topbar";
import Sidebar from "./components/navbar/Sidebar";
import Navbar from "./components/navbar/Navbar";
import { Container } from "./components/ui";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CssBaseline, ThemeProvider } from "@mui/material";
import TeamPage from "./pages/TeamPage"
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterFormPage from "./pages/RegisterFormPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LineChart from "./pages/LineChart";
import Laniakea from "./pages/Laniakea";
import Xitzin2Data from "./pages/Xitzin2Data";
import HybridOperations from "./pages/HybridOperations";
import Banco from "./pages/Banco";
import Dashboard from "./pages/Dashboard";
import Filamentadora from "./pages/Filamentadora";
import Filamentadora2 from "./pages/Filamentadora2";
import Filamentadora3 from "./pages/Filamentadora3";
import LogPage from "./pages/LogPage";
import MainPage from "./pages/MainPage";

function App() {
  const { isAuth, loading } = useAuth();
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

    if (loading) return <h1>Cargando...</h1>;

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="app">
                    <Sidebar isSidebar={isSidebar} />
                    <main className="content">
                        <Topbar setIsSidebar={setIsSidebar} />
                        <Container>
                            <Routes>
                                {/* RUTAS PÚBLICAS  */}
                                <Route
                                    element={<ProtectedRoute isAllowed={!isAuth} redirectTo="/dashboard" />}
                                >
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/about" element={<AboutPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/signup" element={<RegisterPage />} /> {/* <-- AHORA ES PÚBLICA */}
                                </Route>

                                {/* RUTAS PROTEGIDAS */}
                                <Route
                                    element={<ProtectedRoute isAllowed={isAuth} redirectTo="/login" />}
                                >
                                    <Route element={
                                        <UserProvider>
                                            <Outlet />
                                        </UserProvider>
                                    }
                                    >
                                        <Route path="/users" element={<TeamPage />} />
                                    </Route>

                                    <Route element={
                                        <DataProvider>
                                            <Outlet />
                                        </DataProvider>
                                    }
                                    >
                                        <Route path="/main" element={<MainPage />} />
                                        <Route path="/userslog" element={<LogPage />} />
                                        <Route path="/line" element={<LineChart />} />
                                        <Route path="/xitzin2Data" element={<Xitzin2Data />} />
                                        <Route path="/bancodepruebas" element={<Banco />} />
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/filamentadora" element={<Filamentadora />} />
                                        <Route path="/filamentadora2" element={<Filamentadora2 />} />
                                        <Route path="/filamentadora3" element={<Filamentadora3 />} />
                                        <Route path="/laniakea" element={<Laniakea />} />
                                        <Route path="/hybridoperations" element={<HybridOperations />} />
                                    </Route>

                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/users/:id/edit" element={<RegisterFormPage />} />
                                </Route>

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Container>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;