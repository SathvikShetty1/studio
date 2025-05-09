import type { ComplaintCategory, ComplaintPriority } from '@/types';

export interface SuggestCategoryPriorityOutput {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  reasoning: string;
}

// Dummy AI suggestion function
export const suggestCategoryPriority = async (input: { description: string }): Promise<SuggestCategoryPriorityOutput> => {
  // Simulate AI analysis based on description
  const description = input.description.toLowerCase();
  let category: ComplaintCategory = 'General';
  let priority: ComplaintPriority = 'Medium';

  if (description.includes('product') || description.includes('widget')) {
    category = 'Product';
  } else if (description.includes('service') || description.includes('support')) {
    category = 'Service';
  }

  if (description.includes('urgent') || description.includes('critical') || description.includes('unacceptable')) {
    priority = 'High';
  }

  const reasoning = `Based on the description, the complaint seems to be related to ${category.toLowerCase()} and has a ${priority.toLowerCase()} priority.`;

  // Simulate a delay for AI processing
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    category,
    priority,
    reasoning,
  };
};
