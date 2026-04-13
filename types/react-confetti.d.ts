declare module 'react-confetti' {
  import { ComponentType } from 'react';

  interface ConfettiProps {
    width?: number;
    height?: number;
    numberOfPieces?: number;
    friction?: number;
    wind?: number;
    gravity?: number;
    initialVelocityX?: number;
    initialVelocityY?: number;
    colors?: string[];
    opacity?: number;
    recycle?: boolean;
    run?: boolean;
    tweenDuration?: number;
    onConfettiComplete?: (confetti: unknown) => void;
    className?: string;
    style?: React.CSSProperties;
  }

  const Confetti: ComponentType<ConfettiProps>;
  export default Confetti;
}
