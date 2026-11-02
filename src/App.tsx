import { useEffect, useRef, useState } from "react";
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";
import noImage from "./assets/img/no-image.jfif";
import cardData from "./assets/data/message-card.json";
import MessageCard from "./assets/components/MessageCard";
import { detectPostureStatus } from "./assets/misc/utils.ts";
import "./assets/scss/app.scss";

export default function App() {
    const [poseLandmarkerResult, setPoseLandmarkerResult] =
        useState<PoseLandmarker | null>(null);

    const [postureIndex, setPostureIndex] = useState<number>(0);

    const canvas = useRef<HTMLCanvasElement>(null);
    const img = useRef<HTMLImageElement>(null);
    const streamUrl: string = "http://100.86.126.16:8080/video";

    useEffect(() => {
        function urlHandler() {
            if (!img.current) return;

            img.current.src = streamUrl;
        }

        urlHandler();
    }, []);

    useEffect(() => {
        async function apiCall() {
            const vision = await FilesetResolver.forVisionTasks("/wasm");

            const poseLandmarker = await PoseLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: "../model/pose_landmarker_full.task",
                    },
                    runningMode: "IMAGE",
                },
            );

            setPoseLandmarkerResult(poseLandmarker);
        }

        apiCall();
    }, [setPoseLandmarkerResult]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        function resultView() {
            intervalId = setInterval(() => {
                if (!img.current || !canvas.current || !poseLandmarkerResult)
                    return;

                const result = poseLandmarkerResult?.detect(img.current);

                if (result.landmarks && result.landmarks.length > 0) {
                    const currentLandmarks = result.landmarks[0];
                    const index = detectPostureStatus(currentLandmarks);
                    setPostureIndex(index);
                }

                const ctx = canvas.current.getContext("2d");

                if (!ctx) return;

                // Clear canvas sebelumnya
                ctx.clearRect(
                    0,
                    0,
                    canvas.current.width,
                    canvas.current.height,
                );

                const drawingUtils = new DrawingUtils(ctx);

                if (result.landmarks) {
                    for (const landmark of result.landmarks) {
                        // Gambar garis penghubung antar titik tubuh
                        drawingUtils.drawConnectors(
                            landmark,
                            PoseLandmarker.POSE_CONNECTIONS,
                            {
                                color: "#00FF00",
                                lineWidth: 1,
                            },
                        );

                        // Gambar titik-titik posisi tubuh
                        drawingUtils.drawLandmarks(landmark, {
                            color: "#FF0000",
                            lineWidth: 2,
                            radius: 2,
                        });
                    }
                }
            }, 50);
        }

        resultView();

        return () => clearInterval(intervalId);
    });

    console.log(poseLandmarkerResult);

    return (
        <main>
            <section className="img-section">
                <img
                    ref={img}
                    crossOrigin="anonymous"
                    onError={(e) => {
                        e.currentTarget.src = noImage;
                    }}
                />
                <canvas ref={canvas} id="myCanvas"></canvas>
            </section>
            <MessageCard
                header={cardData[postureIndex].header}
                body={cardData[postureIndex].body}
                img={cardData[postureIndex].img}
                backgroundColor={cardData[postureIndex].backgroundColor}
                textColor={cardData[postureIndex].textColor}
            />
        </main>
    );
}
