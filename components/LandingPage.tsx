'use client'

import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Brain, 
  Search, 
  Download, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  BookOpen,
  Target,
  Users,
  Clock,
  Star,
  Play,
  Upload
} from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI analyzes your documents to extract key concepts and insights",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Search,
      title: "Smart Keyword Detection",
      description: "Intelligent keyword extraction with contextual definitions and explanations",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: FileText,
      title: "Document Summarization",
      description: "Get comprehensive summaries with key findings and practical applications",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Download,
      title: "Export & Share",
      description: "Export summaries in multiple formats and share insights with your team",
      color: "from-orange-500 to-red-500"
    }
  ]

  const stats = [
    { number: "10K+", label: "Documents Analyzed" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "50+", label: "Languages Supported" },
    { number: "24/7", label: "Available" }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Research Scientist",
      content: "This tool has revolutionized how I analyze research papers. The AI insights are incredibly accurate.",
      avatar: "SC"
    },
    {
      name: "Prof. Michael Rodriguez",
      role: "University Professor",
      content: "Perfect for students and researchers. The keyword tooltips make complex papers accessible.",
      avatar: "MR"
    },
    {
      name: "Lisa Thompson",
      role: "Technical Writer",
      content: "Saves me hours of work. The document summaries are comprehensive and well-structured.",
      avatar: "LT"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PDF Analyzer
            </span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 mb-8">
                <Sparkles className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">AI-Powered Document Analysis</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Analyze PDFs
                </span>
                <br />
                <span className="text-gray-800">Like Never Before</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform your research workflow with AI-powered keyword detection, 
                intelligent summaries, and interactive tooltips. Perfect for academics, 
                researchers, and professionals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={onGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  Start Analyzing
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-lg font-semibold border border-gray-200 hover:shadow-lg transition-all duration-300 flex items-center">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 animate-ping"></div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 delay-${index * 100} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to analyze and understand complex documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-4 p-6 rounded-2xl transition-all duration-500 ${
                    currentFeature === index
                      ? 'bg-white shadow-xl scale-105'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-blue-100 mb-6">
                    {features[currentFeature].description}
                  </p>
                  <div className="flex justify-center space-x-2">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentFeature === index ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload PDF",
                description: "Drag and drop your PDF document or click to browse",
                icon: Upload
              },
              {
                step: "02", 
                title: "AI Analysis",
                description: "Our AI extracts keywords and generates intelligent summaries",
                icon: Brain
              },
              {
                step: "03",
                title: "Explore & Export",
                description: "Hover over keywords for definitions and export your insights",
                icon: Download
              }
            ].map((step, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Loved by Researchers
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Research?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of researchers who are already using our AI-powered PDF analyzer
            </p>
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
            >
              Start Analyzing Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">PDF Analyzer</span>
          </div>
          <p className="text-gray-400 mb-4">
            AI-powered document analysis for researchers, academics, and professionals
          </p>
          <div className="text-gray-500 text-sm">
            © 2025 PDF Analyzer. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
