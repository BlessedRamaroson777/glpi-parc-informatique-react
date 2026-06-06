import { Navigate } from "react-router-dom";
import { getAccessToken, isTokenExpired } from "../../common/services/authService.jsx";

export default function ProtectedRoute({ children }) {
  const accessToken = getAccessToken();
  const isAuthed = Boolean(accessToken) && !isTokenExpired();

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}