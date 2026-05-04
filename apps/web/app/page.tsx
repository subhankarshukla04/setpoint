"use client";
import { useEffect, useState } from "react";
import LaptopApp from "@/components/LaptopApp";
import PhoneApp from "@/components/PhoneApp";

export default function Home() {
  const [layout, setLayout] = useState<"phone" | "laptop" | null>(null);
  useEffect(() => {
    const set = () => setLayout(window.innerWidth < 768 ? "phone" : "laptop");
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  if (!layout) return null;
  return layout === "phone" ? <PhoneApp /> : <LaptopApp />;
}
