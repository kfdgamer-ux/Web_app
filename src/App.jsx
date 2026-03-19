import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Projects from "./pages/project/Projects";
import Employees from "./pages/employee/Employees";
import ProjectDetail from "./pages/project/ProjectDetail";
import EmployeeDetail from "./pages/employee/EmployeeDetail";
import AddEmployee from "./pages/employee/AddEmployee";

import SidebarLayout from "./components/layout/SidebarLayout";

import AuthProvider from "./context/AuthContext";
import { AuthContext } from "./context/AuthContextValue";
import { useContext } from "react";


function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function PublicRoute({ children }) {
  const { token } = useContext(AuthContext);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Layout */}
          <Route
            element={
              <PrivateRoute>
                <SidebarLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddEmployee />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;
