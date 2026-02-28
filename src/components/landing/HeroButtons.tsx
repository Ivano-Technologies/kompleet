"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function HeroButtons() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/signup"
          className="btn-primary btn-with-icon px-8 py-4 rounded-lg font-bold text-lg"
          aria-label="Get started for free"
        >
          Get started for Free <ArrowRight className="w-5 h-5" />
        </Link>
        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          className="btn-secondary btn-with-icon px-8 py-4 rounded-lg font-bold text-lg"
          aria-label="Watch product demo"
        >
          Watch Demo
        </button>
      </div>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Product Demo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Our product demo video is coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-slate-300 mb-6">
              We are putting the finishing touches on our demo walkthrough. In
              the meantime, create a free account to explore KOMPLEET yourself.
            </p>
            <Link
              href="/signup"
              className="inline-block btn-primary px-6 py-3 rounded-lg font-semibold"
              onClick={() => setDemoOpen(false)}
            >
              Try KOMPLEET for Free
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
