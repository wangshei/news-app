"use client"

import { Button } from "@/components/ui/button"

interface Question {
  id: string
  text: string
}

interface SuggestionButtonsProps {
  questions: Question[]
  onQuestionClick: (question: string) => void
}

export function SuggestionButtons({ questions, onQuestionClick }: SuggestionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {questions.map((question) => (
        <Button
          key={question.id}
          variant="outline"
          className="justify-start text-left h-auto p-4 whitespace-normal bg-transparent"
          onClick={() => onQuestionClick(question.text)}
        >
          {question.text}
        </Button>
      ))}
    </div>
  )
}
