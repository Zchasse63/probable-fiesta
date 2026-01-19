'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchFilters {
  category?: string;
  price_min?: number;
  price_max?: number;
  warehouse_id?: string;
  in_stock?: boolean;
  is_frozen?: boolean;
  search_term?: string;
}

interface SmartSearchProps {
  onFiltersApplied: (filters: SearchFilters, explanation: string) => void;
  onClearFilters: () => void;
}

export function SmartSearch({ onFiltersApplied, onClearFilters }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'No Query',
        description: 'Please enter a search query',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setActiveFilters(data.filters);
      setExplanation(data.explanation);
      onFiltersApplied(data.filters, data.explanation);

      toast({
        title: 'Search Complete',
        description: 'Filters applied based on your query',
      });
    } catch (error: unknown) {
      toast({
        title: 'Search Failed',
        description:
          error instanceof Error ? error.message : 'Failed to parse search query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setActiveFilters(null);
    setExplanation('');
    onClearFilters();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ask in plain English (e.g., 'frozen chicken under $3 from warehouse A')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Understanding...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Search with AI
            </>
          )}
        </Button>
        {activeFilters && (
          <Button variant="ghost" onClick={handleClear}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {activeFilters && explanation && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">AI Interpretation:</p>
          <p className="text-sm">{explanation}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.category && (
              <Badge variant="secondary">Category: {activeFilters.category}</Badge>
            )}
            {activeFilters.price_min !== undefined && (
              <Badge variant="secondary">Min: ${activeFilters.price_min}/lb</Badge>
            )}
            {activeFilters.price_max !== undefined && (
              <Badge variant="secondary">Max: ${activeFilters.price_max}/lb</Badge>
            )}
            {activeFilters.warehouse_id && (
              <Badge variant="secondary">Warehouse: {activeFilters.warehouse_id}</Badge>
            )}
            {activeFilters.in_stock && (
              <Badge variant="secondary">In Stock Only</Badge>
            )}
            {activeFilters.is_frozen !== undefined && (
              <Badge variant="secondary">
                {activeFilters.is_frozen ? 'Frozen' : 'Not Frozen'}
              </Badge>
            )}
            {activeFilters.search_term && (
              <Badge variant="secondary">
                Search: &quot;{activeFilters.search_term}&quot;
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
