import './AnimatedButton.css';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: React.ReactNode;
  hoverLabel?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary';
  isLoading?: boolean;
}

export default function AnimatedButton({ 
  label, 
  hoverLabel, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}: AnimatedButtonProps) {
  const hoverText = hoverLabel || label;
  
  return (
    <button 
      className={`btn-animated btn-${variant} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="label-container">
        <div className="label-normal">
          {isLoading && <span className="spinner" style={{ width: 16, height: 16, display: 'inline-block' }} />}
          {isLoading ? 'Loading...' : label}
        </div>
        <div className="label-hover" aria-hidden="true">
          {isLoading && <span className="spinner" style={{ width: 16, height: 16, display: 'inline-block' }} />}
          {isLoading ? 'Loading...' : hoverText}
        </div>
      </div>
    </button>
  );
}
