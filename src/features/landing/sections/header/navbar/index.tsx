import DesktopNavbar from "./desktop";
import MobileNavbar from "./mobile";

import { useIsMobile } from "~/hooks/use-mobile";

export default function Navbar() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileNavbar /> : <DesktopNavbar />;
}
