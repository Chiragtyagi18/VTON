"use client";

import { motion } from "framer-motion";
import { Sparkles, Cpu, Shirt } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI Pose Detection",
    description:
      "Our advanced AI accurately detects human body pose, joints, and proportions from your uploaded photo for precise garment fitting.",
  },
  {
    icon: Shirt,
    title: "Smart Garment Alignment",
    description:
      "Garments are intelligently aligned and warped to match your body shape, pose, and perspective for a natural, realistic look.",
  },
  {
    icon: Sparkles,
    title: "Instant AI Results",
    description:
      "Get your virtual try-on result in seconds. Our optimized pipeline processes your images quickly without compromising quality.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            <Cpu className="h-3 w-3 text-primary-500" />
            Powered by AI
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Realistic Virtual Try-On
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
