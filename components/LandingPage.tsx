/**
 * Landing Page Component
 * 
 * This component provides an immersive and interactive landing page experience
 * with advanced 3D animations, WebGL fluid simulations, and dynamic visual effects.
 * It serves as the main entry point for the PDF Keyword Analyzer application.
 * 
 * Key Features:
 * - Interactive 3D floating shapes with physics simulation
 * - WebGL fluid simulation background effects
 * - Mouse-responsive animations and parallax effects
 * - Dynamic particle systems and energy effects
 * - Responsive design with dark mode support
 * - Smooth transitions and hover animations
 * - Feature showcase with interactive cards
 * 
 * @fileoverview Interactive landing page with advanced visual effects
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Sparkles,
  ArrowRight,
  Play,
  Brain
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import WebGLFluidSimulation from './WebGLFluidSimulation'
import LoginButton from './LoginButton'
import UserMenu from './UserMenu'

/**
 * Props interface for LandingPage component
 */
interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [shapes, setShapes] = useState<Array<{
    id: number
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    vrx: number
    vry: number
    vrz: number
    rx: number
    ry: number
    rz: number
    size: number
    color: string
    opacity: number
    type: 'cube' | 'pyramid' | 'sphere' | 'cylinder' | 'torus'
    wireframe: boolean
  }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Initialize 3D shapes
  useEffect(() => {
    const generateShapes = () => {
      const newShapes = []
      const shapeTypes = ['cube', 'pyramid', 'sphere', 'cylinder', 'torus'] as const
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']
      
      for (let i = 0; i < 30; i++) {
        newShapes.push({
          id: i,
          x: Math.random() * (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200),
          y: Math.random() * (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800),
          z: Math.random() * 800 - 400,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          vz: (Math.random() - 0.5) * 0.3,
          vrx: (Math.random() - 0.5) * 2,
          vry: (Math.random() - 0.5) * 2,
          vrz: (Math.random() - 0.5) * 2,
          rx: Math.random() * 360,
          ry: Math.random() * 360,
          rz: Math.random() * 360,
          size: Math.random() * 40 + 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.7 + 0.3,
          type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
          wireframe: Math.random() > 0.5
        })
      }
      setShapes(newShapes)
    }

    generateShapes()
  }, [])

  // 3D shape animation
  useEffect(() => {
    const animateShapes = () => {
      setShapes(prevShapes => 
        prevShapes.map(shape => {
          let newX = shape.x + shape.vx
          let newY = shape.y + shape.vy
          let newZ = shape.z + shape.vz
          let newRx = shape.rx + shape.vrx
          let newRy = shape.ry + shape.vry
          let newRz = shape.rz + shape.vrz

          // Mouse interaction with enhanced 3D physics
          const mouseDistance = Math.sqrt(
            Math.pow(mousePosition.x - shape.x, 2) + 
            Math.pow(mousePosition.y - shape.y, 2) +
            Math.pow(shape.z, 2) * 0.1 // Include Z in distance calculation
          )
          
          if (mouseDistance < 250) {
            const force = (250 - mouseDistance) / 250
            const angle = Math.atan2(shape.y - mousePosition.y, shape.x - mousePosition.x)
            
            // Enhanced 3D repulsion
            newX += Math.cos(angle) * force * 3
            newY += Math.sin(angle) * force * 3
            newZ += force * 15
            
            // Add rotation based on mouse proximity
            newRx += force * 5
            newRy += force * 5
            newRz += force * 5
            
            // Increase rotation speed when close to mouse
            shape.vrx += force * 0.1
            shape.vry += force * 0.1
            shape.vrz += force * 0.1
          }

          // Boundary checking with bounce
          if (newX < 0 || newX > (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200)) {
            shape.vx *= -0.8
            newX = Math.max(0, Math.min((typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200), newX))
          }
          if (newY < 0 || newY > (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800)) {
            shape.vy *= -0.8
            newY = Math.max(0, Math.min((typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800), newY))
          }
          if (newZ < -400 || newZ > 400) {
            shape.vz *= -0.8
            newZ = Math.max(-400, Math.min(400, newZ))
          }

          // Damping for rotation
          shape.vrx *= 0.99
          shape.vry *= 0.99
          shape.vrz *= 0.99

          return {
            ...shape,
            x: newX,
            y: newY,
            z: newZ,
            rx: newRx % 360,
            ry: newRy % 360,
            rz: newRz % 360
          }
        })
      )

      animationRef.current = requestAnimationFrame(animateShapes)
    }

    if (isHovering) {
      animationRef.current = requestAnimationFrame(animateShapes)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePosition, isHovering])

  // 3D Shape rendering function
  const render3DShape = (shape: any, mouseInfluence: number) => {
    const size = shape.size
    const color = shape.color
    const glowIntensity = 10 + mouseInfluence * 30
    const shadowColor = color + Math.floor(mouseInfluence * 100).toString(16).padStart(2, '0')
    
    const commonStyle: React.CSSProperties = {
      width: size,
      height: size,
      background: shape.wireframe ? 'transparent' : color,
      border: shape.wireframe ? `2px solid ${color}` : 'none',
      boxShadow: `0 0 ${glowIntensity}px ${shadowColor}`,
      transformStyle: 'preserve-3d' as const
    }

    switch (shape.type) {
      case 'cube':
        return (
          <div 
            className="relative"
            style={{
              ...commonStyle,
              transform: 'rotateX(45deg) rotateY(45deg)',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          >
            {/* Cube faces */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/20 to-transparent" />
          </div>
        )
      
      case 'pyramid':
        return (
          <div 
            className="relative"
            style={{
              ...commonStyle,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              background: `linear-gradient(45deg, ${color}, ${color}80)`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        )
      
      case 'sphere':
        return (
          <div 
            className="relative rounded-full"
            style={{
              ...commonStyle,
              background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}cc, ${color}88)`,
              borderRadius: '50%'
            }}
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
          </div>
        )
      
      case 'cylinder':
        return (
          <div 
            className="relative"
            style={{
              ...commonStyle,
              borderRadius: '50% 50% 0 0',
              background: `linear-gradient(180deg, ${color}ff, ${color}cc)`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )
      
      case 'torus':
        return (
          <div 
            className="relative rounded-full"
            style={{
              ...commonStyle,
              background: `conic-gradient(from 0deg, ${color}00, ${color}ff, ${color}00)`,
              borderRadius: '50%'
            }}
          >
            <div className="absolute inset-4 rounded-full bg-transparent border-2 border-current" />
            <div className="absolute inset-8 rounded-full bg-transparent border border-current opacity-50" />
          </div>
        )
      
      default:
        return <div style={commonStyle} />
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseenter', handleMouseEnter)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseenter', handleMouseEnter)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden"
    >
      {/* WebGL Fluid Simulation */}
      <WebGLFluidSimulation 
        mousePosition={mousePosition} 
        isHovering={isHovering} 
      />

      {/* Interactive Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 3D Floating Shapes */}
        <div className="absolute inset-0">
          {shapes.map((shape) => {
            const scale = Math.max(0.2, 1 - Math.abs(shape.z) / 400)
            const x = shape.x
            const y = shape.y
            const mouseDistance = Math.sqrt(
              Math.pow(mousePosition.x - shape.x, 2) + 
              Math.pow(mousePosition.y - shape.y, 2)
            )
            const mouseInfluence = Math.max(0, 1 - mouseDistance / 250)
            const enhancedScale = scale * (1 + mouseInfluence * 0.5)
            
            return (
              <div
                key={shape.id}
                className="absolute transition-all duration-100 ease-out"
                style={{
                  left: x - shape.size / 2,
                  top: y - shape.size / 2,
                  transform: `scale(${enhancedScale}) rotateX(${shape.rx}deg) rotateY(${shape.ry}deg) rotateZ(${shape.rz}deg)`,
                  opacity: shape.opacity * (0.4 + mouseInfluence * 0.6),
                  zIndex: Math.floor(400 - shape.z),
                  transformStyle: 'preserve-3d'
                }}
              >
                {render3DShape(shape, mouseInfluence)}
              </div>
            )
          })}
        </div>

        {/* 3D Shape Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {shapes.map((shape, index) => {
            const mouseDistance = Math.sqrt(
              Math.pow(mousePosition.x - shape.x, 2) + 
              Math.pow(mousePosition.y - shape.y, 2)
            )
            const mouseInfluence = Math.max(0, 1 - mouseDistance / 250)
            
            return shapes.slice(index + 1, index + 2).map((otherShape) => {
              const distance = Math.sqrt(
                Math.pow(shape.x - otherShape.x, 2) + 
                Math.pow(shape.y - otherShape.y, 2) + 
                Math.pow(shape.z - otherShape.z, 2)
              )
              
              if (distance < 200) {
                const opacity = Math.max(0, (200 - distance) / 200) * 0.4 * (0.6 + mouseInfluence * 0.4)
                const strokeWidth = Math.max(1, (200 - distance) / 200) * 3
                
                return (
                  <line
                    key={`${shape.id}-${otherShape.id}`}
                    x1={shape.x}
                    y1={shape.y}
                    x2={otherShape.x}
                    y2={otherShape.y}
                    stroke={shape.color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    className="transition-all duration-300"
                    style={{
                      filter: `blur(${Math.max(0, 1 - distance / 100)}px) drop-shadow(0 0 5px ${shape.color}50)`
                    }}
                  />
                )
              }
              return null
            })
          })}
        </svg>

        {/* 3D Energy Particles */}
        <div className="absolute inset-0">
          {shapes.filter((_, i) => i % 3 === 0).map((shape, index) => {
            const mouseDistance = Math.sqrt(
              Math.pow(mousePosition.x - shape.x, 2) + 
              Math.pow(mousePosition.y - shape.y, 2)
            )
            const mouseInfluence = Math.max(0, 1 - mouseDistance / 200)
            const scale = Math.max(0.3, 1 - Math.abs(shape.z) / 400)
            
            return (
              <div
                key={`particle-${shape.id}`}
                className="absolute rounded-full transition-all duration-200 ease-out"
                style={{
                  left: shape.x - 6,
                  top: shape.y - 6,
                  width: 12,
                  height: 12,
                  background: `radial-gradient(circle, ${shape.color}cc, ${shape.color}40)`,
                  transform: `scale(${scale * (1 + mouseInfluence * 0.8)}) rotate(${shape.rz}deg)`,
                  opacity: shape.opacity * (0.5 + mouseInfluence * 0.5),
                  zIndex: Math.floor(400 - shape.z),
                  boxShadow: `0 0 ${15 + mouseInfluence * 25}px ${shape.color}${Math.floor(mouseInfluence * 200).toString(16).padStart(2, '0')}`,
                  animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`
                }}
              />
            )
          })}
        </div>

        
        {/* Static animated elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute top-60 left-1/3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-1/3 w-14 h-14 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-25 animate-bounce delay-500"></div>
        
        {/* Dynamic floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.5}s`
              }}
            />
          ))}
        </div>
        
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DocuMind
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <UserMenu />
            <ThemeToggle />
            <a
              href="/auth/signin"
              className="px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Sign In
            </a>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 min-h-[80vh] flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div 
                className="inline-flex items-center px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full border border-blue-200 dark:border-gray-600 mb-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.02}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.02}px) scale(${isHovering ? 1.05 : 1})`
                }}
              >
                <Sparkles className="w-5 h-5 text-yellow-500 mr-2 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI-Powered Document Analysis</span>
              </div>
              
              <h1 
                className="text-5xl md:text-7xl font-bold mb-6"
                style={{
                  transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.01}px)`
                }}
              >
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  Analyze PDFs
                </span>
                <br />
                <span className="text-gray-800 dark:text-white">Like Never Before</span>
              </h1>
              
              <p 
                className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
                style={{
                  transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.005}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.005}px)`
                }}
              >
                Transform your research workflow with AI-powered keyword detection, 
                intelligent summaries, and interactive tooltips. Perfect for academics, 
                researchers, and professionals.
              </p>
              
              <div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                style={{
                  transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.008}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.008}px)`
                }}
              >
                <button
                  onClick={onGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center relative overflow-hidden"
                  style={{
                    transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.01}px) scale(${isHovering ? 1.05 : 1})`
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center">
                    Start Analyzing
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                <button 
                  className="group px-8 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-700 dark:text-gray-300 rounded-full text-lg font-semibold border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 flex items-center hover:scale-105"
                  style={{
                    transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.01}px) scale(${isHovering ? 1.05 : 1})`
                  }}
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Floating Elements that respond to mouse */}
        <div 
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse transition-all duration-500"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 1200) / 2) * 0.03}px, ${(mousePosition.y - (typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.innerHeight : 800) : 800) / 2) * 0.03}px) scale(${isHovering ? 1.2 : 1})`
          }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-20 animate-bounce transition-all duration-500"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * -0.02}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * -0.02}px) scale(${isHovering ? 1.3 : 1})`
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 animate-ping transition-all duration-500"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.04}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.04}px) scale(${isHovering ? 1.1 : 1})`
          }}
        ></div>
        <div 
          className="absolute top-60 left-1/3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-30 animate-pulse delay-1000 transition-all duration-500"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.05}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.05}px) scale(${isHovering ? 1.4 : 1})`
          }}
        ></div>
        <div 
          className="absolute bottom-40 right-1/3 w-14 h-14 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-25 animate-bounce delay-500 transition-all duration-500"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * -0.03}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * -0.03}px) scale(${isHovering ? 1.2 : 1})`
          }}
        ></div>
        
        {/* Enhanced Interactive Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/10 dark:bg-blue-400/5 rounded-full blur-3xl animate-pulse transition-all duration-1000"
            style={{
              transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.01}px) scale(${isHovering ? 1.1 : 1})`
            }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000 transition-all duration-1000"
            style={{
              transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * -0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * -0.01}px) scale(${isHovering ? 1.1 : 1})`
            }}
          ></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              style={{
                transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.005}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.005}px)`
              }}
            >
              Powerful Features
            </h2>
            <p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              style={{
                transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.003}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.003}px)`
              }}
            >
              Everything you need to analyze and understand your documents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className="group text-center p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
              style={{
                transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.01}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.01}px) scale(${isHovering ? 1.02 : 1})`
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Smart Keyword Detection</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                AI-powered keyword extraction with contextual definitions and interactive tooltips for better understanding.
              </p>
              <div className="mt-4 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full group-hover:w-20 transition-all duration-300"></div>
            </div>
            
            <div 
              className="group text-center p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
              style={{
                transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.008}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.008}px) scale(${isHovering ? 1.02 : 1})`
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Intelligent Summaries</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Generate comprehensive document summaries with key findings, methodology, and practical applications.
              </p>
              <div className="mt-4 w-12 h-1 bg-gradient-to-r from-green-500 to-blue-600 mx-auto rounded-full group-hover:w-20 transition-all duration-300"></div>
            </div>
            
            <div 
              className="group text-center p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
              style={{
                transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.006}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.006}px) scale(${isHovering ? 1.02 : 1})`
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Sentiment Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Analyze emotional tone and sentiment to understand the document's perspective and audience impact.
              </p>
              <div className="mt-4 w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-600 mx-auto rounded-full group-hover:w-20 transition-all duration-300"></div>
            </div>
          </div>
        </div>
        
        {/* Interactive Background decorative elements */}
        <div 
          className="absolute top-10 left-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-2xl animate-pulse transition-all duration-1000"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * 0.02}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * 0.02}px) scale(${isHovering ? 1.2 : 1})`
          }}
        ></div>
        <div 
          className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000 transition-all duration-1000"
          style={{
            transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) * -0.02}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight : 800) / 2) * -0.02}px) scale(${isHovering ? 1.2 : 1})`
          }}
        ></div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 px-6 py-3 bg-gray-900/95 backdrop-blur-sm text-white border-t border-gray-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DocuMind
            </span>
          </div>
          <p className="text-gray-400 text-xs">
            © 2025 DocuMind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
