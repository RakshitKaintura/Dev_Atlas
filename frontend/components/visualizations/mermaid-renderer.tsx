"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Download, Copy, AlertCircle, Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toPng } from "html-to-image";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

interface MermaidRendererProps {
  chart: string;
  onNodeClick?: (nodeText: string) => void;
}

export function MermaidRenderer({ chart, onNodeClick }: MermaidRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "var(--font-sans)",
    });

    if (containerRef.current && chart) {
      setError(null);
      containerRef.current.innerHTML = ""; // Clear previous render
      
      const renderId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      
      mermaid.render(renderId, chart)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            if (onNodeClick) {
              const nodes = containerRef.current.querySelectorAll('.node');
              nodes.forEach((node) => {
                // SVG elements need a <title> child element for tooltips, not the HTML title attribute
                let titleEl = node.querySelector('title') as SVGElement | null;
                if (!titleEl) {
                  titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title') as SVGElement;
                  node.appendChild(titleEl);
                }
                titleEl.textContent = 'Click to learn more about this';
                
                const htmlNode = node as HTMLElement;
                htmlNode.style.cursor = 'pointer';
                htmlNode.style.transition = 'opacity 0.2s, filter 0.2s';
                
                node.addEventListener('mouseenter', () => {
                  htmlNode.style.opacity = '0.8';
                  htmlNode.style.filter = 'brightness(1.2)';
                });
                node.addEventListener('mouseleave', () => {
                  htmlNode.style.opacity = '1';
                  htmlNode.style.filter = 'none';
                });
              });
            }
          }
        })
        .catch((e) => {
          console.error("Mermaid syntax error:", e);
          setError(e.message || "Failed to render Mermaid chart");
        });
    }

    const handleNodeClick = (e: MouseEvent) => {
      if (!onNodeClick) return;
      
      // Find the closest parent with class "node"
      const target = e.target as HTMLElement;
      const node = target.closest('.node');
      
      if (node) {
        e.preventDefault();
        // Try to get text from nodeLabel, otherwise use textContent
        const label = node.querySelector('.nodeLabel')?.textContent || node.textContent;
        if (label) {
          onNodeClick(label.trim());
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("click", handleNodeClick);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (container) {
        container.removeEventListener("click", handleNodeClick);
      }
    };
  }, [chart, onNodeClick]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const copyMermaidCode = () => {
    navigator.clipboard.writeText(chart);
  };

  const downloadImage = () => {
    if (!containerRef.current) return;
    
    // Temporarily hide buttons for the screenshot
    const buttons = document.getElementById("mermaid-buttons");
    if (buttons) buttons.style.display = "none";
    
    const wrapper = containerRef.current.parentElement;
    if (!wrapper) return;
    
    toPng(wrapper, { backgroundColor: "#09090b" }) // Assuming a dark background color
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute("download", "devatlas-diagram.png");
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .finally(() => {
        if (buttons) buttons.style.display = "flex";
      });
  };

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    useEffect(() => {
      if (!isFullscreen) {
        resetTransform();
      }
    }, [isFullscreen, resetTransform]);

    return (
      <div id="mermaid-controls" className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border shadow-sm z-50">
        {isFullscreen && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetTransform()}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border my-auto mx-1" />
          </>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>
    );
  };

  return (
    <div 
      ref={wrapperRef}
      className={`w-full border rounded-3xl overflow-hidden bg-muted/10 relative group ${isFullscreen ? 'h-screen border-none rounded-none' : 'h-[600px]'}`}
    >
      {error && (
        <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-muted/5 z-10 overflow-auto">
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-background border rounded-lg text-xs font-mono whitespace-pre-wrap w-full max-w-xl overflow-x-auto text-muted-foreground">
            {chart}
          </div>
        </div>
      )}
      
      {!error && (
        <TransformWrapper
          disabled={!isFullscreen}
          initialScale={1}
          minScale={0.1}
          maxScale={8}
          wheel={{ step: 0.008, disabled: !isFullscreen }}
          pinch={{ disabled: !isFullscreen }}
          doubleClick={{ disabled: !isFullscreen }}
          panning={{ disabled: !isFullscreen }}
        >
          <div className={`w-full h-full ${isFullscreen ? "cursor-grab active:cursor-grabbing" : ""}`}>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%", overflow: isFullscreen ? "hidden" : "auto" }}>
              <div 
                ref={containerRef} 
                className={`w-full h-full p-8 [&>svg]:!max-w-none [&>svg]:min-w-[1000px] [&>svg]:h-auto [&_.node]:cursor-pointer [&_.node:hover]:opacity-80 transition-opacity ${isFullscreen ? "flex items-center justify-center min-w-max min-h-max" : ""}`}
              />
            </TransformComponent>
          </div>
          <Controls />
        </TransformWrapper>
      )}
      
      {!error && (
        <div id="mermaid-buttons" className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <Button variant="secondary" size="sm" onClick={copyMermaidCode}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Code
          </Button>
          <Button variant="default" size="sm" onClick={downloadImage}>
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>
      )}
    </div>
  );
}
