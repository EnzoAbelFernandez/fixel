import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await auth.login(email, password)
      login(data.usuario, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Fixcel</h1>
        <p>Sistema de ventas e inventario</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fixel.local"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
          <p style={{ marginBottom: 4 }}>Demo:</p>
          <p>Admin — admin@fixel.local / admin123</p>
          <p>Vendedor — vendedor@fixel.local / vendedor123</p>
        </div>
      </div>
    </div>
  )
}
