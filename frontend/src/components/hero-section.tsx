"use client";

import { ArrowRight, CheckCircle2, Shield, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

const trustItems = [
  { icon: Shield, label: "No Signup Required" },
  { icon: Zap, label: "AI Powered" },
  { icon: CheckCircle2, label: "Fast Processing" },
];

interface HeroSectionProps {
  onStartTryOn: () => void;
}

export function HeroSection({ onStartTryOn }: HeroSectionProps) {
  return (
    <section id="home" className="relative overflow-hidden bg-zinc-50 pb-20 pt-28 sm:pt-36 dark:bg-zinc-950">
      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 animate-float-slow rounded-full bg-primary-400/20 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 animate-float-slower rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-500/20" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-float rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-400/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              <Sparkles className="h-3 w-3 text-primary-500" />
              AI Powered Virtual Try-On
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
              Try Any Outfit <br />
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                Instantly with AI
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Upload your photo and the garment you love. Our AI creates a
              realistic virtual try-on so you can see exactly how it looks
              before you buy.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartTryOn}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700"
              >
                Start Try-On
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <item.icon className="h-3.5 w-3.5 text-primary-500" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <div className="animate-float-slower">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-900/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-500/20">
                    <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">VTO Studio</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Virtual Try-On Workspace</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="text-center text-zinc-400 dark:text-zinc-500">
                      <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20">
                        <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      </div>
                      <p className="text-[10px]">Your Photo</p>
                    </div>
                  </div>
                  <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="text-center text-zinc-400 dark:text-zinc-500">
                      <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20">
                        <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 0l5.25-5.25M3.75 12l5.25 5.25" /></svg>
                      </div>
                      <p className="text-[10px]">Garment</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white dark:bg-primary-500">
                  <Sparkles className="h-4 w-4" />
                  Generate Try-On
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
