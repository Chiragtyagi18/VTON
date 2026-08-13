"use client";

import { motion } from "framer-motion";
import { Camera, Shirt, Cpu, Sparkles } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Camera,
    title: "Upload Photo",
    description:
      "Take or upload a clear photo of yourself in any pose.",
  },
  {
    number: 2,
    icon: Shirt,
    title: "Add Garment",
    description:
      "Upload the clothing item you want to try on.",
  },
  {
    number: 3,
    icon: Cpu,
    title: "AI Processing",
    description:
      "Our AI intelligently analyzes your body pose and accurately fits the garment for a realistic virtual try-on.",
  },
  {
    number: 4,
    icon: Sparkles,
    title: "Virtual Try-On",
    description:
      "Instantly preview yourself wearing the selected outfit and download the result.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-zinc-50 py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            <Sparkles className="h-3 w-3 text-primary-500" />
            Simple Workflow
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Experience the Future of Online Shopping in Four Simple Steps
          </h2>
        </motion.div>

        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector lines (desktop) */}
          <div className="pointer-events-none absolute top-16 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] hidden h-0.5 lg:block">
            <div className="h-full w-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 animate-gradient-x bg-[length:200%_100%]" />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Number badge */}
              <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-[11px] font-bold text-white shadow-sm">
                {step.number}
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg transition-transform duration-300 group-hover:scale-110">
                <step.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
