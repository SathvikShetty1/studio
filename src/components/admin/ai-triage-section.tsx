"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { suggestCategoryPriority, SuggestCategoryPriorityOutput } from '@/ai/flows/suggest-category-priority';
import type { ComplaintCategory, ComplaintPriority } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AITriageSectionProps {
  complaintDescription: string;
  currentCategory?: ComplaintCategory;
  currentPriority?: ComplaintPriority;
  onSuggestionApplied: (suggestion: { category: ComplaintCategory; priority: ComplaintPriority }) => void;
}

export function AITriageSection({ complaintDescription, currentCategory, currentPriority, onSuggestionApplied }: AITriageSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestCategoryPriorityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await suggestCategoryPriority({ description: complaintDescription });
      setSuggestion(result);
    } catch (err) {
      console.error("AI Triage Error:", err);
      setError("Failed to get AI suggestion. Please try again.");
    }
    setIsLoading(false);
  };

  const handleApplySuggestion = () => {
    if (suggestion) {
      onSuggestionApplied({
        category: suggestion.category as ComplaintCategory, // Assuming AI output matches enum
        priority: suggestion.priority as ComplaintPriority, // Assuming AI output matches enum
      });
      setSuggestion(null); // Clear suggestion after applying
    }
  };

  return (
    <Card className="bg-secondary/50 border-dashed border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="mr-2 h-5 w-5 text-primary" />
          AI-Powered Triage Assistant
        </CardTitle>
        <CardDescription>
          Let AI suggest a category and priority based on the complaint description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={complaintDescription}
          readOnly
          rows={3}
          className="bg-background"
          aria-label="Complaint description for AI Triage"
        />
        <Button onClick={handleGetSuggestion} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Get AI Suggestion
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestion && (
          <Card className="mt-4 shadow-sm bg-background">
            <CardHeader>
              <CardTitle className="text-md">AI Suggestion:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Suggested Category:</strong> {suggestion.category}</p>
              <p><strong>Suggested Priority:</strong> {suggestion.priority}</p>
              <p className="text-xs text-muted-foreground">
                <strong>Reasoning:</strong> {suggestion.reasoning}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleApplySuggestion} size="sm" variant="outline">
                Apply Suggestion
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
