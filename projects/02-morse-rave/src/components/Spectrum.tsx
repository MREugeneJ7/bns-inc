import { useEffect, useRef, type RefObject } from "react";

export function Spectrum({
  analyserRef,
  active,
}: {
  analyserRef: RefObject<AnalyserNode | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    const data = new Uint8Array(128);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resize.observe(canvas);
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const styles = getComputedStyle(canvas);
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(
        0,
        styles.getPropertyValue("--primary").trim() || "#ff43d0",
      );
      gradient.addColorStop(
        1,
        styles.getPropertyValue("--secondary").trim() || "#47eeff",
      );
      context.fillStyle = gradient;
      if (activeRef.current && analyserRef.current && !reducedMotion)
        analyserRef.current.getByteFrequencyData(data);
      else data.fill(0);
      const bars = 52;
      const gap = 3;
      const barWidth = (width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const value = data[Math.floor(2 + i * 1.6)] / 255;
        const h = Math.max(2, value * (height - 2));
        context.globalAlpha = activeRef.current ? 0.35 + value * 0.65 : 0.28;
        context.fillRect(
          i * (barWidth + gap),
          (height - h) / 2,
          Math.max(1, barWidth),
          h,
        );
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      className="spectrum"
      aria-label="Live audio spectrum"
      role="img"
    />
  );
}
