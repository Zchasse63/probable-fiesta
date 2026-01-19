'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ParsedDeal {
  manufacturer: string;
  product_description: string;
  price_per_lb: number;
  quantity_lbs: number;
  pack_size: string;
  expiration_date?: string;
  deal_terms?: string;
}

interface DealParserProps {
  onDealParsed: (deal: ParsedDeal, dealId: string) => void;
}

export function DealParser({ onDealParsed }: DealParserProps) {
  const [content, setContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedDeal, setParsedDeal] = useState<ParsedDeal | null>(null);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!content.trim()) {
      toast({
        title: 'No Content',
        description: 'Please paste email content to parse',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);

    try {
      const response = await fetch('/api/ai/parse-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse deal');
      }

      const data = await response.json();
      setParsedDeal(data.deal);
      onDealParsed(data.deal, data.dealId);

      toast({
        title: 'Deal Parsed',
        description: 'Deal information extracted successfully',
      });
    } catch (error: unknown) {
      toast({
        title: 'Parse Failed',
        description: error instanceof Error ? error.message : 'Failed to parse deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const getConfidenceBadge = () => {
    if (!parsedDeal) return null;

    const requiredFields = [
      'manufacturer',
      'product_description',
      'price_per_lb',
      'quantity_lbs',
      'pack_size',
    ];
    const filledRequired = requiredFields.filter(
      (field) => parsedDeal[field as keyof ParsedDeal]
    ).length;
    const confidence = (filledRequired / requiredFields.length) * 100;

    if (confidence === 100) {
      return <Badge className="bg-success">High Confidence</Badge>;
    } else if (confidence >= 60) {
      return <Badge className="bg-warning-600">Medium Confidence</Badge>;
    } else {
      return <Badge variant="destructive">Low Confidence</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Parse Manufacturer Deal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste manufacturer deal email content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />

          <Button onClick={handleParse} disabled={isParsing || !content.trim()}>
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting deal information...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Parse with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {parsedDeal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Extracted Information</CardTitle>
              {getConfidenceBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Manufacturer
                </p>
                <p className="text-sm">{parsedDeal.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pack Size</p>
                <p className="text-sm">{parsedDeal.pack_size}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Product Description
                </p>
                <p className="text-sm">{parsedDeal.product_description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Price per lb
                </p>
                <p className="text-sm">${parsedDeal.price_per_lb.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Quantity (lbs)
                </p>
                <p className="text-sm">{parsedDeal.quantity_lbs.toLocaleString()}</p>
              </div>
              {parsedDeal.expiration_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expiration Date
                  </p>
                  <p className="text-sm">{parsedDeal.expiration_date}</p>
                </div>
              )}
              {parsedDeal.deal_terms && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Deal Terms
                  </p>
                  <p className="text-sm">{parsedDeal.deal_terms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
