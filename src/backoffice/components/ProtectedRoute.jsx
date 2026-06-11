import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  refreshAuthSession,
  isBackofficeAuthenticated
} from "../../common/services/authService.jsx";
export default function ProtectedRoute({ children }) {

  const isAuthenticated = isBackofficeAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
// export default function ProtectedRoute({ children }) {
//   const [state, setState] = useState("checking");

//   useEffect(() => {
//     let mounted = true;

//     async function checkAuth() {
//       const accessToken = getAccessToken();

//       if (accessToken && !isTokenExpired()) {
//         if (mounted) setState("authed");
//         return;
//       }

//       const refreshToken = getRefreshToken();
//       if (!refreshToken) {
//         if (mounted) setState("unauth");
//         return;
//       }

//       try {
//         await refreshAuthSession();
//         if (mounted) setState("authed");
//       } catch {
//         if (mounted) setState("unauth");
//       }
//     }

//     checkAuth();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   if (state === "checking") {
//     return null;
//   }

//   if (state !== "authed") {
//     return <Navigate to="/admin/login" replace />;
//   }

//   return children;
// }