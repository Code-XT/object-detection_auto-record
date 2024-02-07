"use client";
import { ModeToggle } from "@/components/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FlipHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import Webcam from "react-webcam";
export default function Home() {
  const camRef = useRef(null);
  const canvasRef = useRef(null);
  const [mirrored, setMirrored] = useState(true);
  return (
    <div className="flex h-screen">
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam ref={camRef} className="w-full h-full object-contain p-2" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col justify-between shadow-md rounded-md p-4">
          <div className="flex flex-col gap-2">
            <ModeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal />
            </Button>{" "}
            <Separator />
          </div>
          <div className="flex flex-col gap-2">
            <Separator>How Are</Separator>
          </div>
          <div className="flex flex-col gap-2">
            You
            <Separator />
          </div>
        </div>
      </div>
    </div>
  );
}
