import "../styles/login.css";
import GlpiLoginForm from "../components/GlpiLoginForm.jsx";

export default function Login() {
  return (
    <section id="login" className="login-page">
      <h1>Login</h1>
      <p>Connexion via OAuth GLPI.</p>
      <GlpiLoginForm />
    </section>
  );
}
