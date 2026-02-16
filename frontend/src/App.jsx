import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Combos from './pages/Combos'
import Ventas from './pages/Ventas'
import Garantias from './pages/Garantias'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <div className="login-page"><p>Cargando...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/productos" element={
        <ProtectedRoute>
          <Layout><Productos /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/combos" element={
        <ProtectedRoute>
          <Layout><Combos /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/ventas" element={
        <ProtectedRoute>
          <Layout><Ventas /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/garantias" element={
        <ProtectedRoute>
          <Layout><Garantias /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/reportes" element={
        <ProtectedRoute adminOnly>
          <Layout><Reportes /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/usuarios" element={
        <ProtectedRoute adminOnly>
          <Layout><Usuarios /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
