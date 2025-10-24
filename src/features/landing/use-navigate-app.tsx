import { useNavigate } from "react-router";

export const LS_KEY = "novagraph.landingPreference";

export default function useNavigateApp() {
  const navigate = useNavigate();

  const navigateToApp = () => {
    localStorage.setItem(LS_KEY, "app");
    navigate("/app");
  };

  return { navigateToApp };
}
