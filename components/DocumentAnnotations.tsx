/**
 * Document Annotations Component
 * 
 * This component provides a wrapper for the UnifiedAnnotations component
 * specifically for document owners. It manages annotation count tracking
 * and provides a simplified interface for document annotation management.
 * 
 * Key Features:
 * - Annotation count tracking and reporting
 * - Owner-specific annotation interface
 * - Integration with UnifiedAnnotations component
 * - Callback for annotation count changes
 * 
 * @fileoverview Document owner annotation wrapper component
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect } from 'react'
import UnifiedAnnotations from './UnifiedAnnotations'

/**
 * Interface for annotation data structure
 */
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

/**
 * Interface for reply data structure
 */
interface Reply {
  _id: string
  text: string
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
}

/**
 * Props interface for DocumentAnnotations component
 */
interface DocumentAnnotationsProps {
  documentId: string
  documentText: string
  onAnnotationCountChange?: (count: number) => void
}

/**
 * Document Annotations Component
 * 
 * This component renders the annotation interface for document owners
 * with annotation count tracking and management capabilities.
 * 
 * State Management:
 * - annotationCount: Current number of annotations
 * 
 * @param documentId - ID of the document being annotated
 * @param documentText - Full text content of the document
 * @param onAnnotationCountChange - Callback for annotation count changes
 * @returns JSX element containing the document annotation interface
 */
export default function DocumentAnnotations({ 
  documentId, 
  documentText,
  onAnnotationCountChange 
}: DocumentAnnotationsProps) {
  const [annotationCount, setAnnotationCount] = useState(0)

  /**
   * Notify parent component of annotation count changes
   */
  useEffect(() => {
    onAnnotationCountChange?.(annotationCount)
  }, [annotationCount, onAnnotationCountChange])

  /**
   * Handle new annotation addition
   * 
   * @param annotation - New annotation that was added
   */
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
