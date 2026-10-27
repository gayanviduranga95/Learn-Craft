import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ showLabel = false, compact = false }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  const currentOption = options.find((opt) => opt.value === theme) || options[2];
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  if (compact) {
    // Quick toggle button between light and dark
    return (
      <button
        type="button"
        className="lc-theme-toggle-compact"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={`Current mode: ${resolvedTheme}. Click to toggle.`}
        aria-label="Toggle color theme"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          border: "1px solid var(--lc-border, #e4eaf4)",
          background: "var(--lc-white, #ffffff)",
          color: "var(--lc-text, #132447)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <CurrentIcon size={18} />
      </button>
    );
  }

  return (
    <div className="lc-theme-dropdown-wrap" ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="lc-theme-dropdown-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Change theme preference"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "7px 12px",
          borderRadius: "12px",
          border: "1px solid var(--lc-border, #e4eaf4)",
          background: "var(--lc-white, #ffffff)",
          color: "var(--lc-text, #132447)",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <CurrentIcon size={16} />
        {showLabel && <span>{currentOption.label}</span>}
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Theme selection"
          className="lc-theme-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 100,
            minWidth: "140px",
            background: "var(--lc-white, #ffffff)",
            border: "1px solid var(--lc-border, #e4eaf4)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {options.map(({ value, label, icon: Icon }) => {
            const isSelected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: isSelected
                    ? "var(--lc-primary-soft, rgba(8, 123, 255, 0.12))"
                    : "transparent",
                  color: isSelected
                    ? "var(--lc-blue, #087bff)"
                    : "var(--lc-text, #132447)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.15s ease",
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
                {isSelected && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--lc-blue, #087bff)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
