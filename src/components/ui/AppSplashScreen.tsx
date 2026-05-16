import Image from 'next/image';

type AppSplashScreenProps = {
  className?: string;
  label?: string;
};

export default function AppSplashScreen({
  className = '',
  label,
}: AppSplashScreenProps) {
  return (
    <div className={`app-splash ${className}`} role="status" aria-live="polite">
      <div className="app-splash__content">
        <Image
          src="/icons/logo-show.png"
          alt="Vmito"
          width={704}
          height={304}
          priority
          unoptimized
          className="app-splash__logo"
        />
        {label ? <p className="app-splash__label">{label}</p> : null}
        <div className="app-splash__loader" aria-hidden="true" />
      </div>
    </div>
  );
}
