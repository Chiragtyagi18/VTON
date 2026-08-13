"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const examples = [
  { title: "Casual Look", tag: "Top", src: "/iamge.png" },
  { title: "Summer Style", tag: "Dress", src: "/iamge2.jpeg" },
  { title: "Denim Jacket", tag: "Jacket", src: "/iamge3.jpeg" },
];

export function ExamplesGallery() {
  return (
    <section id="examples" className="bg-zinc-50 py-20 dark:bg-zinc-950">
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
            Sample Results
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See Virtual Try-On in Action
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
                  {/* <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View Result
                  </span> */}
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {item.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
