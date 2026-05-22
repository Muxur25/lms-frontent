import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-2xl transition-all duration-300 z-50">
      <CardHeader className="cursor-pointer bg-[var(--surface-1)] rounded-t-xl" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-xl">✨</span> AI Yordamchi
        </CardTitle>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="h-64 flex flex-col p-4 bg-[var(--bg-1)]">
          <div className="flex-1 overflow-y-auto mb-4 text-sm text-[var(--text-secondary)]">
            Salom! Men sizning shaxsiy AI yordamchigizman. Kurslar yoki imtihonlar bo'yicha savollaringiz bormi?
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Savolingizni yozing..." 
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border-1)] rounded-md px-3 py-1 text-sm outline-none focus:border-[var(--blue-500)] transition-colors"
            />
            <Button size="sm">Yuborish</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
