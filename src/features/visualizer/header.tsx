import { HelpCircle, Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";
import { useTheme } from "~/hooks/use-theme";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between shrink-0 h-16 px-6 bg-gradient-to-r from-neutral-low/20 to-neutral/20 border-b border-b-border">
      {/* Logo + App Name */}
      <div className="flex items-center gap-2">
        <Logo alt="NovaGraph" className="w-6 h-6 text-primary" />
        <span className="medium-title hidden sm:block">NovaGraph</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Light/Dark Mode Toggle */}
        <Button variant="ghost" size="icon" onClick={() => toggleTheme()}>
          {theme === "dark" ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </Button>
        {/* TODO: User Guide */}
        <Button
          className="bg-neutral-low hover:bg-neutral-low/50"
          variant="outline"
        >
          <HelpCircle className="w-6 h-6" />
          User Guide
        </Button>
      </div>
    </header>
  );
}
