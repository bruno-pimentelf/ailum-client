"use client"

import { useEffect, useRef } from "react"

interface Particle {
    x: number;
    y: number;
    anchorX: number;
    anchorY: number;
    size: number;
    baseAlpha: number;
    phase: number; // for pulsation
    pulseSpeed: number;
}

export function ParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const particlesRef = useRef<Particle[]>([])
    const animationRef = useRef<number>(0)
    const glowDivRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles()
        }

        const initParticles = () => {
            const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 11000)
            particlesRef.current = Array.from({ length: particleCount }).map(() => {
                const x = Math.random() * canvas.width
                const y = Math.random() * canvas.height
                return {
                    x,
                    y,
                    anchorX: x,
                    anchorY: y,
                    size: Math.random() * 1.5 + 0.5,
                    baseAlpha: Math.random() * 0.25 + 0.08,
                    phase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.008 + Math.random() * 0.015,
                }
            })
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
            if (glowDivRef.current) {
                glowDivRef.current.style.transform = `translate(${e.clientX - 400}px, ${e.clientY - 400}px)`
                glowDivRef.current.style.opacity = '1'
            }
        }

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 }
            if (glowDivRef.current) {
                glowDivRef.current.style.opacity = '0'
            }
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const { x: mouseX, y: mouseY } = mouseRef.current
            const mouseActive = mouseX !== -1000

            particlesRef.current.forEach(p => {
                // Natural pulsation phase
                p.phase += p.pulseSpeed

                // Calculate distance from mouse to anchor point
                const dxMouse = mouseX - p.anchorX
                const dyMouse = mouseY - p.anchorY
                const distToMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

                const influenceRadius = 350
                let displacementX = 0
                let displacementY = 0
                let brightnessBoost = 0

                if (mouseActive && distToMouse < influenceRadius) {
                    const influence = 1 - (distToMouse / influenceRadius)
                    const easedInfluence = influence * influence // quadratic falloff for smoother feel

                    // Displacement: push AWAY from mouse (reverberation effect)
                    const angle = Math.atan2(p.anchorY - mouseY, p.anchorX - mouseX)
                    const maxDisplacement = 25
                    displacementX = Math.cos(angle) * easedInfluence * maxDisplacement
                    displacementY = Math.sin(angle) * easedInfluence * maxDisplacement

                    // Add a wave-like oscillation for reverberation
                    const waveFreq = distToMouse * 0.02
                    const wave = Math.sin(p.phase * 3 + waveFreq) * easedInfluence * 4
                    displacementX += Math.cos(angle + Math.PI / 2) * wave
                    displacementY += Math.sin(angle + Math.PI / 2) * wave

                    // Brightness boost — closer = brighter
                    brightnessBoost = easedInfluence * 1.8
                }

                // Smoothly interpolate current position toward target (anchor + displacement)
                const targetX = p.anchorX + displacementX
                const targetY = p.anchorY + displacementY
                p.x += (targetX - p.x) * 0.08
                p.y += (targetY - p.y) * 0.08

                // Natural pulsation (always active, subtle)
                const pulse = Math.sin(p.phase) * 0.12
                const currentAlpha = Math.min(1, p.baseAlpha + pulse + brightnessBoost)

                // Dynamic size — slightly bigger when influenced
                const dynamicSize = p.size + (brightnessBoost > 0.1 ? brightnessBoost * 1.2 : 0)

                // Draw
                ctx.beginPath()
                ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(0, 181, 212, ${currentAlpha})`

                // Glow only on significantly boosted particles
                if (brightnessBoost > 0.3) {
                    ctx.shadowBlur = 20 * brightnessBoost
                    ctx.shadowColor = `rgba(0, 181, 212, ${brightnessBoost * 0.6})`
                } else {
                    ctx.shadowBlur = 0
                }

                ctx.fill()
                ctx.shadowBlur = 0
            })

            animationRef.current = requestAnimationFrame(render)
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseleave", handleMouseLeave)
        render()

        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleMouseLeave)
            cancelAnimationFrame(animationRef.current)
        }
    }, [])

    return (
        <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full overflow-hidden">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block h-full w-full"
            />

            {/* Ambient glow following mouse */}
            <div
                ref={glowDivRef}
                className="absolute rounded-full pointer-events-none z-0 transition-opacity duration-300"
                style={{
                    width: '800px',
                    height: '800px',
                    background: 'radial-gradient(circle, rgba(0, 181, 212, 0.04) 0%, transparent 60%)',
                    opacity: 0,
                    willChange: 'transform',
                }}
            />
        </div>
    )
}
