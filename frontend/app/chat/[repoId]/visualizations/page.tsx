"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, X } from "lucide-react";

import { MermaidRenderer } from "@/components/visualizations/mermaid-renderer";
import { ProcessingAnimation } from "@/components/chat/processing-animation";
import { useRepository, useGenerateVisualizations, useSearchContext } from "@/hooks/use-repos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// removed Sheet imports
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";

export default function VisualizationsPage(props: {
  params: Promise<{ repoId: string }>;
}) {
  const params = use(props.params);
  const repoId = params.repoId;
  const [isPolling, setIsPolling] = useState(false);
  const { data: repo, isLoading } = useRepository(repoId, isPolling);
  const { mutate: generate, isPending: isStartingGeneration } = useGenerateVisualizations();
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { data: nodeData, isLoading: isNodeLoading } = useSearchContext(repoId, selectedNode);

  const hasDiagrams = Boolean(
    repo?.architectureDiagram ||
    repo?.schemaDiagram ||
    repo?.flowDiagram ||
    repo?.workingFlowDiagram ||
    repo?.componentTreeDiagram ||
    repo?.apiEndpointDiagram
  );

  useEffect(() => {
    // Stop polling if we finally got diagrams
    if (isPolling && hasDiagrams) {
      setTimeout(() => setIsPolling(false), 0);
    }
  }, [hasDiagrams, isPolling]);

  const handleGenerate = () => {
    setIsPolling(true);
    if (repo) generate(repo.id);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Skeleton className="h-[600px] w-full max-w-5xl rounded-3xl" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Repository not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur">
        <Button variant="ghost" size="icon" render={<Link href={`/chat/${repo.id}`} />} nativeButton={false} className="shrink-0">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-1 items-center gap-2 font-medium">
          <span className="text-muted-foreground">{repo.owner}</span>
          <span className="text-muted-foreground">/</span>
          <span>{repo.name}</span>
          <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Visualizations
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isStartingGeneration || isPolling || repo.indexStatus !== "READY"}
        >
          {isStartingGeneration || isPolling ? (
            <RefreshCw className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          {isStartingGeneration || isPolling ? "Generating..." : hasDiagrams ? "Regenerate" : "Generate Now"}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 transition-all duration-300">
          <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Project Architecture & Flows
            </h1>
            <p className="text-muted-foreground">
              AI-generated Mermaid diagrams analyzing the structure, database, and
              workflows of {repo.name}.
            </p>
          </div>

          {!hasDiagrams ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed p-12 text-center min-h-[400px]">
              {isPolling ? (
                <ProcessingAnimation stage={repo.currentStage || "ANALYZING_DATA"} />
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <RefreshCw className="size-8" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    No Visualizations Yet
                  </h2>
                  <p className="max-w-md text-muted-foreground">
                    Click the button below to analyze the codebase and generate interactive architecture, schema, and flow diagrams using AI.
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={isStartingGeneration || repo.indexStatus !== "READY"}
                    className="mt-4"
                  >
                    {isStartingGeneration ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Visualizations"
                    )}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Tabs defaultValue="architecture" className="w-full">
              <TabsList className="mb-6 grid w-full max-w-4xl grid-cols-6">
                <TabsTrigger value="architecture">Architecture</TabsTrigger>
                <TabsTrigger value="schema">DB Schema</TabsTrigger>
                <TabsTrigger value="flow">Data Flow</TabsTrigger>
                <TabsTrigger value="working">Working Flows</TabsTrigger>
                <TabsTrigger value="component">Component Tree</TabsTrigger>
                <TabsTrigger value="api">API Map</TabsTrigger>
              </TabsList>

              <TabsContent value="architecture" className="space-y-4">
                {repo.architectureDiagram ? (
                  <MermaidRenderer chart={repo.architectureDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                {repo.schemaDiagram ? (
                  <MermaidRenderer chart={repo.schemaDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>

              <TabsContent value="flow" className="space-y-4">
                {repo.flowDiagram ? (
                  <MermaidRenderer chart={repo.flowDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>

              <TabsContent value="working" className="space-y-4">
                {repo.workingFlowDiagram ? (
                  <MermaidRenderer chart={repo.workingFlowDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>

              <TabsContent value="component" className="space-y-4">
                {repo.componentTreeDiagram ? (
                  <MermaidRenderer chart={repo.componentTreeDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>

              <TabsContent value="api" className="space-y-4">
                {repo.apiEndpointDiagram ? (
                  <MermaidRenderer chart={repo.apiEndpointDiagram} onNodeClick={setSelectedNode} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not generated.</p>
                )}
              </TabsContent>
            </Tabs>
          )}
          </div>
        </main>

        {/* Sidebar Panel */}
        {selectedNode !== null && (
          <aside className="w-[400px] sm:w-[500px] border-l bg-background overflow-y-auto flex-shrink-0 transition-all duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
              <h3 className="font-semibold truncate mr-2" title={selectedNode}>Component: {selectedNode}</h3>
              <Button variant="ghost" size="icon" className="shrink-0 size-8" onClick={() => setSelectedNode(null)}>
                <X className="size-4" />
                <span className="sr-only">Close sidebar</span>
              </Button>
            </div>
            <div className="p-6">
              {isNodeLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : nodeData ? (
                <div className="space-y-4">
                  <ChatMarkdown content={nodeData.contextText} />
                  {nodeData.citations?.length > 0 && (
                    <div className="pt-4 mt-6 border-t">
                      <h4 className="text-sm font-semibold mb-2">Sources</h4>
                      <CitationChips repo={repo} citations={nodeData.citations} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Failed to load explanation.</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
