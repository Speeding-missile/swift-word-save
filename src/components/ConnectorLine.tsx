import { useEffect, useRef } from "react";

interface ConnectorLineProps {
  sourceId: string | null;
  targetId: string | null;
  panelSide?: "left" | "right";
}

export function ConnectorLine({ sourceId, targetId, panelSide = "right" }: ConnectorLineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let animationId: number;

    const updateLine = () => {
      if (!sourceId || !targetId || !pathRef.current) {
        if (pathRef.current) pathRef.current.setAttribute("d", "");
        animationId = requestAnimationFrame(updateLine);
        return;
      }

      const sourceEl = document.getElementById(sourceId);
      const targetEl = document.getElementById(targetId);

      if (sourceEl && targetEl) {
        const sRect = sourceEl.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();

        const isLeft = panelSide === "left";
        const startX = isLeft ? sRect.left : sRect.right;
        const startY = sRect.top + sRect.height / 2;

        const endX = isLeft ? tRect.right : tRect.left;
        const endY = tRect.top + 40; // connect near the top of the side panel

        // Safety check if target is somehow to the left of source (e.g. mobile wrapping)
        if ((!isLeft && endX <= startX) || (isLeft && endX >= startX)) {
          pathRef.current.setAttribute("d", "");
        } else {
          const controlPointX = startX + (endX - startX) / 2;
          const d = `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
          pathRef.current.setAttribute("d", d);
        }
      } else {
        pathRef.current.setAttribute("d", "");
      }

      animationId = requestAnimationFrame(updateLine);
    };

    animationId = requestAnimationFrame(updateLine);
    return () => cancelAnimationFrame(animationId);
  }, [sourceId, targetId, panelSide]);

  if (!sourceId || !targetId) return null;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    >
      <path
        ref={pathRef}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="opacity-40"
      />
    </svg>
  );
}
