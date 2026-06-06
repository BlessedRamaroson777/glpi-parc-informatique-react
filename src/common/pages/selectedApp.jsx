/**
 * Page de sélection - Backoffice ou Frontoffice
 */

import { useNavigate } from 'react-router-dom'
import '../styles/selectapp.css'

export default function SelectApp() {
  const navigate = useNavigate()

  return (
    <div className="select-app-container">
      <div className="select-app-content">
        <h1>MyApp</h1>
        <p>Bienvenue. Veuillez choisir votre accès:</p>

        <div className="app-selector">
          <a
            className="app-card admin-card"
            onClick={() => navigate('/admin')}
          >
            {/* <div className="card-icon">👨‍💼</div> */}
            <h2>Administration</h2>
            <p>Accès backoffice</p>
          </a>

          <a
            className="app-card customer-card"
            onClick={() => navigate('/')}
          >
            {/* <div className="card-icon">👤</div> */}
            <h2>Client</h2>
            <p>Espace client</p>
          </a>
        </div>
      </div>
    </div>
  )
}