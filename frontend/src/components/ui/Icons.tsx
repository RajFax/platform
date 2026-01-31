type IconProps = {
  className?: string;
  title?: string;
};

export function SensorIcon({ className, title = "Capteur" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M6 12a6 6 0 0 1 12 0" />
      <path d="M3.5 12a8.5 8.5 0 0 1 17 0" />
      <path d="M12 4v-1" />
    </svg>
  );
}

export function ActuatorIcon({ className, title = "Actionneur" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="3" y="7" width="10" height="10" rx="2" />
      <path d="M14 12h4" />
      <path d="M18 9l3 3-3 3" />
      <path d="M6 7V4" />
      <path d="M10 7V4" />
    </svg>
  );
}

export function CropIcon({ className, title = "Culture" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M4 14c6-6 10-6 16-6-1 7-5 11-10 11-3 0-5-2-6-5Z" />
      <path d="M12 8v12" />
    </svg>
  );
}
