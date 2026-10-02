"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, File as FileIcon, Database, Brain } from "lucide-react";

export function ProcessingAnimation({ stage }: { stage: string }) {
  const renderAnimation = () => {
    switch (stage) {
      case "SCANNING":
        return <ScanningAnimation />;
      case "READING":
        return <ReadingAnimation />;
      case "CHUNKING":
        return <ChunkingAnimation />;
      case "EMBEDDING":
        return <EmbeddingAnimation />;
      case "ANALYZING_DATA":
        return <AnalyzingDataAnimation />;
      case "CREATING_CHART":
        return <CreatingChartAnimation />;
      case "BUILDING_FLOWCHART":
        return <BuildingFlowchartAnimation />;
      case "DELETING":
        return <DeletingAnimation />;
      case "COMPLETE":
        return <CompleteAnimation />;
      case "ERROR":
        return <ErrorAnimation />;
      default:
        return <ScanningAnimation />;
    }
  };

  const getTitle = () => {
    switch (stage) {
      case "SCANNING": return "Scanning Files";
      case "READING": return "Reading Content";
      case "CHUNKING": return "Creating Knowledge Chunks";
      case "EMBEDDING": return "Feeding to AI";
      case "ANALYZING_DATA": return "Analyzing Codebase";
      case "CREATING_CHART": return "Building Architecture Diagram";
      case "BUILDING_FLOWCHART": return "Constructing Data Flow";
      case "DELETING": return "Deleting Data";
      case "COMPLETE": return "Processing Complete";
      case "ERROR": return "Processing Failed";
      default: return "Processing...";
    }
  };

  const getDescription = () => {
    switch (stage) {
      case "SCANNING": return "Locating and preparing files in the repository...";
      case "READING": return "Extracting text and identifying structures...";
      case "CHUNKING": return "Breaking down files into digestible pieces...";
      case "EMBEDDING": return "Generating embeddings for vector search...";
      case "ANALYZING_DATA": return "Synthesizing structural and logical context...";
      case "CREATING_CHART": return "Drafting architecture and schema charts...";
      case "BUILDING_FLOWCHART": return "Mapping out business logic and request flows...";
      case "DELETING": return "Permanently removing vector embeddings and charts...";
      case "COMPLETE": return "All tasks finished successfully.";
      case "ERROR": return "An error occurred during processing.";
      default: return "Please wait while we process your request...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto min-h-[300px]">
      <div className="h-40 w-full flex items-center justify-center mb-8 relative">
        {renderAnimation()}
      </div>
      <motion.h3 
        key={stage + "-title"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-foreground mb-2 text-center"
      >
        {getTitle()}
      </motion.h3>
      <motion.p 
        key={stage + "-desc"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm text-muted-foreground text-center"
      >
        {getDescription()}
      </motion.p>
    </div>
  );
}

function ScanningAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-24 h-24 rounded-full border border-primary/20 border-t-primary"
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.1, 1], opacity: [0, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        <FileIcon className="w-10 h-10 text-primary" />
      </motion.div>
    </div>
  );
}

function ReadingAnimation() {
  return (
    <div className="relative w-24 h-32 bg-card border rounded-lg p-3 flex flex-col gap-2 overflow-hidden shadow-sm">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          style={{ originX: 0 }}
          className={`h-2 rounded-full ${i === 1 ? 'w-full bg-primary/40' : i === 4 ? 'w-1/2 bg-muted-foreground/30' : 'w-full bg-muted-foreground/30'}`}
        />
      ))}
      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-1 bg-primary/50 shadow-[0_0_8px_rgba(var(--primary),0.8)] z-10"
      />
    </div>
  );
}

function ChunkingAnimation() {
  return (
    <div className="flex items-center gap-4">
      <motion.div 
        animate={{ x: [-10, 0, -10], opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-20 bg-card border rounded-lg flex items-center justify-center"
      >
        <FileText className="w-6 h-6 text-muted-foreground" />
      </motion.div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="w-20 h-6 bg-primary/10 border border-primary/30 rounded text-[10px] flex items-center px-2 text-primary"
          >
            Chunk {i}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmbeddingAnimation() {
  return (
    <div className="flex items-center justify-between w-full max-w-[200px]">
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            className="w-8 h-6 bg-primary/20 rounded border border-primary/40"
          />
        ))}
      </div>
      
      <div className="relative flex-1 h-20">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: "80%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
            className="absolute top-[50%] w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"
            style={{ marginTop: (i - 2) * 12 + "px" }}
          />
        ))}
      </div>

      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-16 h-16 bg-card border-2 border-primary rounded-full flex items-center justify-center relative overflow-hidden shrink-0"
      >
        <Brain className="w-8 h-8 text-primary relative z-10" />
        <motion.div 
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-primary/20"
        />
      </motion.div>
    </div>
  );
}

function AnalyzingDataAnimation() {
  return (
    <div className="relative w-32 h-32">
      <Database className="w-full h-full text-muted-foreground/20" />
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { width: 0, opacity: 0 },
              visible: { width: "60%", opacity: 1, transition: { repeat: Infinity, repeatType: "reverse", duration: 1.5 } }
            }}
            className="h-2 bg-primary rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
}

function CreatingChartAnimation() {
  return (
    <div className="flex items-end gap-2 h-24 border-b-2 border-l-2 border-muted-foreground/30 p-2 pb-0 pl-2">
      {[40, 70, 45, 90, 60].map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.8, delay: i * 0.15, type: "spring", bounce: 0.4 }}
          className="w-6 bg-primary rounded-t-sm"
        />
      ))}
    </div>
  );
}

function BuildingFlowchartAnimation() {
  return (
    <div className="relative w-40 h-32 flex flex-col items-center justify-between">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-16 h-8 bg-primary/20 border border-primary text-[10px] flex items-center justify-center rounded text-primary"
      >
        Start
      </motion.div>
      
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: 24 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-0.5 bg-primary/50"
      />

      <div className="flex gap-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7 }}
          className="w-16 h-8 bg-secondary border border-secondary-foreground/20 text-[10px] flex items-center justify-center rounded"
        >
          Process A
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 }}
          className="w-16 h-8 bg-secondary border border-secondary-foreground/20 text-[10px] flex items-center justify-center rounded"
        >
          Process B
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute top-[56px] w-12 h-0.5 bg-primary/50"
      />
    </div>
  );
}

function DeletingAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 0.8, 0], opacity: [1, 0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      </motion.div>
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute w-32 h-32 rounded-full border border-destructive/20 bg-destructive/10"
      />
    </div>
  );
}

function CompleteAnimation() {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
      className="text-green-500"
    >
      <CheckCircle2 className="w-20 h-20" />
    </motion.div>
  );
}

function ErrorAnimation() {
  return (
    <motion.div
      initial={{ rotate: -10 }}
      animate={{ rotate: 10 }}
      transition={{ duration: 0.2, repeat: 5, repeatType: "reverse" }}
      className="text-destructive flex flex-col items-center justify-center h-full"
    >
      <div className="text-4xl font-bold">Error</div>
    </motion.div>
  );
}
