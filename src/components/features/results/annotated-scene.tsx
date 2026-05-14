'use client';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { IdentifiedComponent } from '@/lib/ai/schemas';
import { categoryColorDeep } from '@/lib/categories';

interface Props {
  imageUrl: string;
  components: IdentifiedComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function AnnotatedScene({
  imageUrl,
  components,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  return (
    <div className="bg-card relative overflow-hidden rounded-xl border shadow-soft">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={6}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%' }}
          contentStyle={{ width: '100%' }}
        >
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Scanned scene"
              className="block w-full select-none"
              draggable={false}
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              {components.map((c, i) => {
                const isSelected = selectedId === c.id;
                const isHovered = hoveredId === c.id;
                const color = categoryColorDeep(c.category);
                const num = i + 1;
                return (
                  <g
                    key={c.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => onSelect(c.id)}
                    onMouseEnter={() => onHover(c.id)}
                    onMouseLeave={() => onHover(null)}
                  >
                    <rect
                      x={c.boundingBox.x}
                      y={c.boundingBox.y}
                      width={c.boundingBox.width}
                      height={c.boundingBox.height}
                      fill={isSelected || isHovered ? color : 'transparent'}
                      fillOpacity={isSelected ? 0.18 : isHovered ? 0.1 : 0}
                      stroke={color}
                      strokeWidth={isSelected ? 0.005 : 0.003}
                      strokeOpacity={isSelected || isHovered ? 1 : 0.7}
                      vectorEffect="non-scaling-stroke"
                      style={{
                        transition: 'all 0.15s ease',
                      }}
                    />
                    <g
                      transform={`translate(${c.boundingBox.x}, ${c.boundingBox.y})`}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={0.018}
                        fill={color}
                        stroke="white"
                        strokeWidth={0.003}
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={0.018}
                        fontWeight={700}
                        fill="white"
                        style={{ userSelect: 'none' }}
                      >
                        {num}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className="bg-card/80 absolute bottom-3 right-3 rounded-md border px-2 py-1 text-xs backdrop-blur">
        <span className="text-muted-foreground">Scroll to zoom · drag to pan</span>
      </div>
    </div>
  );
}