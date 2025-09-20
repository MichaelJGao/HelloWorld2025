'use client'

import { useEffect, useRef, useState } from 'react'

interface WebGLFluidSimulationProps {
  mousePosition: { x: number; y: number }
  isHovering: boolean
}

export default function WebGLFluidSimulation({ mousePosition, isHovering }: WebGLFluidSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const animationRef = useRef<number>()
  const [isInitialized, setIsInitialized] = useState(false)

  // Large 3D objects data
  const [objects, setObjects] = useState<Array<{
    id: number
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    rx: number
    ry: number
    rz: number
    vrx: number
    vry: number
    vrz: number
    size: number
    color: [number, number, number]
    type: 'cube' | 'sphere' | 'pyramid' | 'torus'
    mass: number
  }>>([])

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    glRef.current = gl

    // Vertex shader source
    const vertexShaderSource = `
      attribute vec3 position;
      attribute vec3 color;
      attribute vec3 normal;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vColor = color;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    // Fragment shader source
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      uniform vec3 lightPosition;
      uniform vec3 lightColor;
      uniform float time;
      
      void main() {
        // Dynamic lighting with multiple light sources
        vec3 lightDir = normalize(lightPosition - vPosition);
        float diff = max(dot(vNormal, lightDir), 0.0);
        
        // Ambient lighting with color variation
        float ambient = 0.2 + 0.1 * sin(time * 0.5 + vPosition.x * 0.02);
        
        // Specular highlights with dynamic intensity
        vec3 viewDir = normalize(-vPosition);
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
        
        // Rim lighting for fluid effect
        float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
        rim = pow(rim, 2.0);
        
        // Combine lighting
        vec3 lighting = ambient + diff * 0.8 + spec * 0.4 + rim * 0.3;
        
        // Add color variation based on position and time
        vec3 colorVariation = vec3(
          0.1 * sin(time * 1.5 + vPosition.x * 0.03),
          0.1 * sin(time * 1.2 + vPosition.y * 0.03),
          0.1 * sin(time * 1.8 + vPosition.z * 0.03)
        );
        
        vec3 finalColor = vColor * lighting * lightColor + colorVariation;
        
        // Add pulsing glow effect
        float glow = 0.15 + 0.15 * sin(time * 3.0 + vPosition.x * 0.02 + vPosition.y * 0.02);
        finalColor += glow * vColor * 0.5;
        
        // Add some transparency variation
        float alpha = 0.7 + 0.2 * sin(time * 2.0 + vPosition.x * 0.01);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return

    programRef.current = program

    // Set up WebGL state
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)

    // Initialize large objects
    initializeObjects()

    setIsInitialized(true)
  }, [])

  // Initialize large 3D objects with fluid-like behavior
  const initializeObjects = () => {
    const newObjects = []
    const types = ['cube', 'sphere', 'pyramid', 'torus'] as const
    const colors = [
      [0.2, 0.6, 1.0],   // Blue
      [0.8, 0.2, 0.8],   // Purple
      [1.0, 0.4, 0.6],   // Pink
      [0.2, 0.8, 0.4],   // Green
      [1.0, 0.6, 0.2],   // Orange
      [0.4, 0.8, 1.0],   // Cyan
      [1.0, 0.2, 0.2],   // Red
      [0.6, 0.2, 1.0],   // Violet
    ]

    for (let i = 0; i < 12; i++) {
      const size = Math.random() * 1.2 + 0.6 // Larger objects
      const mass = size * 2 + 1
      
      newObjects.push({
        id: i,
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6,
        z: (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.03,
        vy: (Math.random() - 0.5) * 0.03,
        vz: (Math.random() - 0.5) * 0.03,
        rx: Math.random() * 360,
        ry: Math.random() * 360,
        rz: Math.random() * 360,
        vrx: (Math.random() - 0.5) * 3,
        vry: (Math.random() - 0.5) * 3,
        vrz: (Math.random() - 0.5) * 3,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        mass
      })
    }
    setObjects(newObjects)
  }

  // Create shader function
  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  // Create program function
  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram()
    if (!program) return null

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }

    return program
  }

  // Generate geometry for different shapes
  const generateGeometry = (type: string, size: number) => {
    const vertices = []
    const colors = []
    const normals = []
    const indices = []

    switch (type) {
      case 'cube':
        // Cube vertices
        const cubeVertices = [
          // Front face
          -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
          // Back face
          -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
          // Top face
          -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
          // Bottom face
          -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
          // Right face
           1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
          // Left face
          -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
        ]

        const cubeIndices = [
          0,  1,  2,    0,  2,  3,    // front
          4,  5,  6,    4,  6,  7,    // back
          8,  9, 10,    8, 10, 11,    // top
         12, 13, 14,   12, 14, 15,    // bottom
         16, 17, 18,   16, 18, 19,    // right
         20, 21, 22,   20, 22, 23     // left
        ]

        for (let i = 0; i < cubeVertices.length; i += 3) {
          vertices.push(cubeVertices[i] * size, cubeVertices[i + 1] * size, cubeVertices[i + 2] * size)
        }

        for (let i = 0; i < cubeIndices.length; i++) {
          indices.push(cubeIndices[i])
        }

        // Add normals for cube
        const cubeNormals = [
          // Front face
           0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
          // Back face
           0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
          // Top face
           0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
          // Bottom face
           0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
          // Right face
           1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
          // Left face
          -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0
        ]

        for (let i = 0; i < cubeNormals.length; i += 3) {
          normals.push(cubeNormals[i], cubeNormals[i + 1], cubeNormals[i + 2])
        }
        break

      case 'sphere':
        // Simple sphere approximation
        const segments = 16
        const rings = 8
        
        for (let i = 0; i <= rings; i++) {
          const lat = Math.PI * i / rings - Math.PI / 2
          const y = Math.sin(lat)
          const scale = Math.cos(lat)
          
          for (let j = 0; j <= segments; j++) {
            const lng = 2 * Math.PI * j / segments
            const x = Math.cos(lng) * scale
            const z = Math.sin(lng) * scale
            
            vertices.push(x * size, y * size, z * size)
            normals.push(x, y, z)
          }
        }

        for (let i = 0; i < rings; i++) {
          for (let j = 0; j < segments; j++) {
            const a = i * (segments + 1) + j
            const b = a + segments + 1
            
            indices.push(a, b, a + 1)
            indices.push(b, b + 1, a + 1)
          }
        }
        break

      case 'pyramid':
        // Pyramid vertices
        const pyramidVertices = [
          // Base
          -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
          // Apex
           0,  1,  0
        ]

        const pyramidIndices = [
          // Base
          0, 1, 2,   0, 2, 3,
          // Sides
          0, 1, 4,   1, 2, 4,   2, 3, 4,   3, 0, 4
        ]

        for (let i = 0; i < pyramidVertices.length; i += 3) {
          vertices.push(pyramidVertices[i] * size, pyramidVertices[i + 1] * size, pyramidVertices[i + 2] * size)
        }

        for (let i = 0; i < pyramidIndices.length; i++) {
          indices.push(pyramidIndices[i])
        }

        // Add normals for pyramid
        const pyramidNormals = [
          // Base
           0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
          // Apex
           0,  1,  0
        ]

        for (let i = 0; i < pyramidNormals.length; i += 3) {
          normals.push(pyramidNormals[i], pyramidNormals[i + 1], pyramidNormals[i + 2])
        }
        break

      case 'torus':
        // Simple torus approximation
        const torusSegments = 16
        const torusRings = 8
        const innerRadius = 0.3
        const outerRadius = 1.0
        
        for (let i = 0; i <= torusRings; i++) {
          const u = 2 * Math.PI * i / torusRings
          for (let j = 0; j <= torusSegments; j++) {
            const v = 2 * Math.PI * j / torusSegments
            const x = (outerRadius + innerRadius * Math.cos(v)) * Math.cos(u)
            const y = (outerRadius + innerRadius * Math.cos(v)) * Math.sin(u)
            const z = innerRadius * Math.sin(v)
            
            vertices.push(x * size, y * size, z * size)
            normals.push(x, y, z)
          }
        }

        for (let i = 0; i < torusRings; i++) {
          for (let j = 0; j < torusSegments; j++) {
            const a = i * (torusSegments + 1) + j
            const b = a + torusSegments + 1
            
            indices.push(a, b, a + 1)
            indices.push(b, b + 1, a + 1)
          }
        }
        break
    }

    return { vertices, colors, normals, indices }
  }

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !glRef.current || !programRef.current) return

    const gl = glRef.current
    const program = programRef.current

    const animate = (time: number) => {
      // Update objects physics with fluid simulation
      setObjects(prevObjects => {
        const updatedObjects = prevObjects.map(obj => {
          let newX = obj.x + obj.vx
          let newY = obj.y + obj.vy
          let newZ = obj.z + obj.vz
          let newRx = obj.rx + obj.vrx
          let newRy = obj.ry + obj.vry
          let newRz = obj.rz + obj.vrz

          // Mouse interaction with fluid-like forces
          if (isHovering) {
            const mouseX = (mousePosition.x / window.innerWidth) * 2 - 1
            const mouseY = -((mousePosition.y / window.innerHeight) * 2 - 1)
            
            const mouseDistance = Math.sqrt(
              Math.pow(mouseX - obj.x, 2) + 
              Math.pow(mouseY - obj.y, 2) + 
              Math.pow(obj.z, 2) * 0.1
            )
            
            if (mouseDistance < 2.0) {
              const force = (2.0 - mouseDistance) / 2.0
              const angle = Math.atan2(obj.y - mouseY, obj.x - mouseX)
              
              // Fluid-like repulsion with mass consideration
              const repulsionForce = force * 0.08 / obj.mass
              newX += Math.cos(angle) * repulsionForce
              newY += Math.sin(angle) * repulsionForce
              newZ += force * 0.15 / obj.mass
              
              // Add rotation based on mouse movement
              newRx += force * 3 / obj.mass
              newRy += force * 3 / obj.mass
              newRz += force * 3 / obj.mass
              
              // Add velocity based on mouse proximity
              obj.vx += Math.cos(angle) * force * 0.001
              obj.vy += Math.sin(angle) * force * 0.001
              obj.vz += force * 0.002
            }
          }

          // Object-to-object interactions (fluid-like collisions)
          prevObjects.forEach(otherObj => {
            if (otherObj.id !== obj.id) {
              const distance = Math.sqrt(
                Math.pow(obj.x - otherObj.x, 2) + 
                Math.pow(obj.y - otherObj.y, 2) + 
                Math.pow(obj.z - otherObj.z, 2)
              )
              
              const minDistance = (obj.size + otherObj.size) * 0.8
              
              if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance
                const angle = Math.atan2(obj.y - otherObj.y, obj.x - otherObj.x)
                const force = overlap * 0.1
                
                // Apply separation force
                newX += Math.cos(angle) * force / obj.mass
                newY += Math.sin(angle) * force / obj.mass
                newZ += force * 0.5 / obj.mass
                
                // Add some rotation from collision
                newRx += force * 2
                newRy += force * 2
                newRz += force * 2
              }
            }
          })

          // Gravity and buoyancy simulation
          const gravity = 0.0005
          const buoyancy = 0.0003
          obj.vy -= gravity * obj.mass
          obj.vy += buoyancy

          // Boundary checking with soft constraints
          if (newX < -3.0 || newX > 3.0) {
            obj.vx *= -0.7
            newX = Math.max(-3.0, Math.min(3.0, newX))
          }
          if (newY < -3.0 || newY > 3.0) {
            obj.vy *= -0.7
            newY = Math.max(-3.0, Math.min(3.0, newY))
          }
          if (newZ < -3.0 || newZ > 3.0) {
            obj.vz *= -0.7
            newZ = Math.max(-3.0, Math.min(3.0, newZ))
          }

          // Fluid damping (air resistance)
          const damping = 0.998
          obj.vx *= damping
          obj.vy *= damping
          obj.vz *= damping
          obj.vrx *= 0.99
          obj.vry *= 0.99
          obj.vrz *= 0.99

          return {
            ...obj,
            x: newX,
            y: newY,
            z: newZ,
            rx: newRx % 360,
            ry: newRy % 360,
            rz: newRz % 360
          }
        })
        
        return updatedObjects
      })

      // Clear canvas
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Use shader program
      gl.useProgram(program)

      // Get attribute locations
      const positionLocation = gl.getAttribLocation(program, 'position')
      const colorLocation = gl.getAttribLocation(program, 'color')
      const normalLocation = gl.getAttribLocation(program, 'normal')

      // Get uniform locations
      const modelViewMatrixLocation = gl.getUniformLocation(program, 'modelViewMatrix')
      const projectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix')
      const normalMatrixLocation = gl.getUniformLocation(program, 'normalMatrix')
      const lightPositionLocation = gl.getUniformLocation(program, 'lightPosition')
      const lightColorLocation = gl.getUniformLocation(program, 'lightColor')
      const timeLocation = gl.getUniformLocation(program, 'time')

      // Set up projection matrix
      const projectionMatrix = createPerspectiveMatrix(75, 1, 0.1, 100)
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

      // Set lighting
      gl.uniform3f(lightPositionLocation, 2, 2, 2)
      gl.uniform3f(lightColorLocation, 1, 1, 1)
      gl.uniform1f(timeLocation, time * 0.001)

      // Render each object
      objects.forEach(obj => {
        const geometry = generateGeometry(obj.type, obj.size)
        
        // Create buffers
        const positionBuffer = gl.createBuffer()
        const colorBuffer = gl.createBuffer()
        const normalBuffer = gl.createBuffer()
        const indexBuffer = gl.createBuffer()

        // Fill buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW)

        // Create colors array
        const colors = []
        for (let i = 0; i < geometry.vertices.length / 3; i++) {
          colors.push(obj.color[0], obj.color[1], obj.color[2])
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW)

        // Set up attributes
        gl.enableVertexAttribArray(positionLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

        gl.enableVertexAttribArray(colorLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)

        gl.enableVertexAttribArray(normalLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)

        // Create model view matrix
        const modelViewMatrix = createModelViewMatrix(obj.x, obj.y, obj.z, obj.rx, obj.ry, obj.rz)
        gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)

        // Create normal matrix
        const normalMatrix = createNormalMatrix(modelViewMatrix)
        gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix)

        // Draw
        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0)

        // Clean up
        gl.deleteBuffer(positionBuffer)
        gl.deleteBuffer(colorBuffer)
        gl.deleteBuffer(normalBuffer)
        gl.deleteBuffer(indexBuffer)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInitialized, mousePosition, isHovering, objects])

  // Matrix helper functions
  const createPerspectiveMatrix = (fov: number, aspect: number, near: number, far: number) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov * Math.PI / 180)
    const rangeInv = 1.0 / (near - far)

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]
  }

  const createModelViewMatrix = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => {
    const cos = Math.cos
    const sin = Math.sin
    const rxRad = rx * Math.PI / 180
    const ryRad = ry * Math.PI / 180
    const rzRad = rz * Math.PI / 180

    const cosX = cos(rxRad)
    const sinX = sin(rxRad)
    const cosY = cos(ryRad)
    const sinY = sin(ryRad)
    const cosZ = cos(rzRad)
    const sinZ = sin(rzRad)

    return [
      cosY * cosZ, -cosY * sinZ, sinY, 0,
      sinX * sinY * cosZ + cosX * sinZ, -sinX * sinY * sinZ + cosX * cosZ, -sinX * cosY, 0,
      -cosX * sinY * cosZ + sinX * sinZ, cosX * sinY * sinZ + sinX * cosZ, cosX * cosY, 0,
      x, y, z, 1
    ]
  }

  const createNormalMatrix = (modelViewMatrix: number[]) => {
    const m = modelViewMatrix
    const det = m[0] * (m[5] * m[10] - m[6] * m[9]) -
                m[1] * (m[4] * m[10] - m[6] * m[8]) +
                m[2] * (m[4] * m[9] - m[5] * m[8])

    const invDet = 1.0 / det

    return [
      (m[5] * m[10] - m[6] * m[9]) * invDet,
      (m[2] * m[9] - m[1] * m[10]) * invDet,
      (m[1] * m[6] - m[2] * m[5]) * invDet,
      (m[6] * m[8] - m[4] * m[10]) * invDet,
      (m[0] * m[10] - m[2] * m[8]) * invDet,
      (m[2] * m[4] - m[0] * m[6]) * invDet,
      (m[4] * m[9] - m[5] * m[8]) * invDet,
      (m[1] * m[8] - m[0] * m[9]) * invDet,
      (m[0] * m[5] - m[1] * m[4]) * invDet
    ]
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
      width={1200}
      height={800}
    />
  )
}
