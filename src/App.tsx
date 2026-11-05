import React, { useEffect, useRef, useState } from "react";
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";
import cardData from "./assets/data/message-card.json";
import MessageCard from "./assets/components/MessageCard";
import { detectPostureStatus } from "./assets/misc/utils.ts";
import "./assets/scss/app.scss";

export default function App() {
    interface UrlHost {
        host: string;
    }

    const [poseLandmarkerResult, setPoseLandmarkerResult] =
        useState<PoseLandmarker | null>(null);

    const [postureIndex, setPostureIndex] = useState<number>(4);

    const [urlHost, setUrlHost] = useState<UrlHost>();

    const canvas = useRef<HTMLCanvasElement>(null);
    const img = useRef<HTMLImageElement>(null);

    useEffect(() => {
        let landmarker: PoseLandmarker | null = null;

        async function apiCall() {
            try {
                const vision = await FilesetResolver.forVisionTasks("/wasm");
                landmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "../model/pose_landmarker_full.task",
                    },
                    runningMode: "IMAGE",
                });
                setPoseLandmarkerResult(landmarker);
            } catch (err) {
                console.error("Gagal menginisialisasi MediaPipe:", err);
            }
        }

        apiCall();

        return () => {
            landmarker?.close();
        };
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        function renderLoop() {
            if (
                img.current &&
                canvas.current &&
                poseLandmarkerResult &&
                img.current.complete &&
                img.current.naturalWidth > 0 &&
                img.current.naturalHeight > 0
            ) {
                if (
                    canvas.current.width !== img.current.clientWidth ||
                    canvas.current.height !== img.current.clientHeight
                ) {
                    canvas.current.width = img.current.clientWidth;
                    canvas.current.height = img.current.clientHeight;
                }

                try {
                    const result = poseLandmarkerResult.detect(img.current);

                    if (result.landmarks && result.landmarks.length > 0) {
                        setPostureIndex(
                            detectPostureStatus(result.landmarks[0]),
                        );
                    } else if (
                        result.landmarks &&
                        result.landmarks.length === 0
                    ) {
                        setPostureIndex(3);
                    }

                    const ctx = canvas.current.getContext("2d");
                    if (ctx) {
                        ctx.clearRect(
                            0,
                            0,
                            canvas.current.width,
                            canvas.current.height,
                        );
                        const drawingUtils = new DrawingUtils(ctx);

                        if (result.landmarks) {
                            for (const landmark of result.landmarks) {
                                drawingUtils.drawConnectors(
                                    landmark,
                                    PoseLandmarker.POSE_CONNECTIONS,
                                    {
                                        color: "#00FF00",
                                        lineWidth: 1,
                                    },
                                );
                                drawingUtils.drawLandmarks(landmark, {
                                    color: "#FF0000",
                                    lineWidth: 2,
                                    radius: 2,
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.warn(err);
                }
            }

            animationFrameId = requestAnimationFrame(renderLoop);
        }

        if (poseLandmarkerResult) {
            renderLoop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [poseLandmarkerResult, urlHost?.host]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;

        setUrlHost((prevState) => {
            return { ...prevState, [name]: value } as UrlHost;
        });
    }

    return (
        <main>
            <input
                type="text"
                name="host"
                value={urlHost?.host}
                onChange={handleChange}
            />
            <section className="img-section">
                <img
                    ref={img}
                    src={`http://${urlHost?.host}:8080/video`}
                    crossOrigin="anonymous"
                    onError={() => {
                        setPostureIndex(4);
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
