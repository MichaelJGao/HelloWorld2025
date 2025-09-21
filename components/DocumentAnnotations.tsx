'use client'

import React, { useState, useEffect } from 'react'
import UnifiedAnnotations from './UnifiedAnnotations'

interface Annotation {
  _id: string
  text: string
  selectedText: string
  position: any
  type: 'comment' | 'highlight' | 'question' | 'suggestion'
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
  replies: Reply[]
}

interface Reply {
  _id: string
  text: string
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
}

interface DocumentAnnotationsProps {
  documentId: string
  documentText: string
  onAnnotationCountChange?: (count: number) => void
}

export default function DocumentAnnotations({ 
  documentId, 
  documentText,
  onAnnotationCountChange 
}: DocumentAnnotationsProps) {
  const [annotationCount, setAnnotationCount] = useState(0)

  useEffect(() => {
    onAnnotationCountChange?.(annotationCount)
  }, [annotationCount, onAnnotationCountChange])

  const handleAnnotationAdd = (annotation: Annotation) => {
    setAnnotationCount(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <UnifiedAnnotations
        documentId={documentId}
        documentText={documentText}
        isOwner={true}
        onAnnotationAdd={handleAnnotationAdd}
      />
    </div>
  )
}
