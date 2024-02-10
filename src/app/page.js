"use client";
import { ModeToggle } from "@/components/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CameraIcon,
  FlipHorizontal,
  PersonStanding,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { drawOnCanvas } from "@/utils/draw";
import { toast } from "sonner";

export default function Home() {
  let interval = null;
  let stop_timer = null;

  const camRef = useRef(null);
  const canvasRef = useRef(null);
  const [mirrored, setMirrored] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoRecord, setIsAutoRecord] = useState(false);
  const [model, setModel] = useState();
  const [loading, setLoading] = useState(false);

  const mediaRecorder = useRef(null);

  useEffect(() => {
    if (camRef && camRef.current) {
      const stream = camRef.current.video.captureStream();
      if (stream) {
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecorder.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecorder.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [camRef]);

  const resizeCanvas = (video, canvas) => {
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  };
  const runPrediction = async () => {
    if (
      model &&
      camRef.current &&
      camRef.current.video &&
      camRef.current.video.readyState === 4
    ) {
      const video = camRef.current.video;
      const predictions = await model.detect(video);

      console.log(predictions);

      resizeCanvas(camRef.current.video, canvasRef.current);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));

      let isPerson = false;
      if (predictions.length > 0)
        predictions.forEach((detectedObject) => {
          if (detectedObject.class == "person") isPerson = true;
        });
      if (isPerson && isAutoRecord) startRecording();
    }
  };

  useEffect(() => {
    setLoading(true);
    initModel();
  }, []);

  useEffect(() => {
    if (model) {
      setLoading(false);
    }
  });

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 100);

    return () => clearInterval(interval);
  }, [camRef.current, model, mirrored, runPrediction, isAutoRecord]);

  const initModel = async () => {
    const model = await cocossd.load({
      base: "lite_mobilenet_v2",
    });
    setModel(model);
  };

  const screenShot = () => {
    if (!camRef.current) {
      toast("Camera not found. Please refresh");
    } else {
      const imageSrc = camRef.current.getScreenshot();
      const blob = base64toBlob(imageSrc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formatDate(new Date())}.png`;
      link.click();
    }
  };

  const videoRecord = () => {
    if (!camRef.current) {
      toast("Camera not found. Please refresh");
    }
    if (mediaRecorder.current?.state == "recording") {
      mediaRecorder.current.requestData();
      mediaRecorder.current.stop();
      toast("Recording Saved");
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    mediaRecorder.current.start();
    toast("Recording Started");
    stop_timer = setTimeout(() => {
      mediaRecorder.current.requestData();
      mediaRecorder.current.stop();
      toast("Recording Saved");
    }, 20000);
  };

  const autoRecord = () => {
    if (!camRef.current) {
      toast("Camera not found. Please refresh");
    } else {
      setIsAutoRecord((prev) => !prev);
      if (isAutoRecord) {
        const imageSrc = camRef.current.getScreenshot();
        const blob = base64toBlob(imageSrc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${formatDate(new Date())}.mp4`;
        link.click();
        setIsAutoRecord(false);
      }
    }
  };

  const base64toBlob = (base64) => {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return blob;
  };

  return (
    <div className="flex h-screen">
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam
            ref={camRef}
            mirrored={mirrored}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: 1280,
              height: 720,
              aspectRatio: 16 / 9,
            }}
            className="w-full h-full object-contain p-2"
          />
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
            <Separator />
            <Button variant="outline" size="icon" onClick={screenShot}>
              <CameraIcon />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={videoRecord}
            >
              <Video />
            </Button>
            <Button
              variant={isAutoRecord ? "destructive" : "outline"}
              size="icon"
              onClick={autoRecord}
            >
              {isAutoRecord ? (
                <Rings
                  visible={true}
                  height="50"
                  width="50"
                  color="#4fa94d"
                  ariaLabel="rings-loading"
                  wrapperStyle={{}}
                  wrapperClass=""
                />
              ) : (
                <PersonStanding />
              )}
            </Button>
            <Separator />
          </div>
          <div className="flex flex-col gap-2">
            <Button></Button>
            <Separator />
          </div>
        </div>
      </div>
      {loading && (
        <div className="z-50 absolute w-full h-full flex items-center justify-center bg-primary-foreground">
          Getting things ready . . . <Rings height={50} color="red" />
        </div>
      )}
    </div>
  );
}
function formatDate(d) {
  const formattedDate =
    [
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getDate().toString().padStart(2, "0"),
      d.getFullYear(),
    ].join("-") +
    " " +
    [
      d.getHours().toString().padStart(2, "0"),
      d.getMinutes().toString().padStart(2, "0"),
      d.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}
