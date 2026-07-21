import { Archive } from 'lucide-react';
import { archiveQuestion } from '@/app/questions/actions';
import { Button } from '@/components/ui';

export function ArchiveQuestionButton({ questionId }: { questionId: string }) {
  return (
    <form action={archiveQuestion}>
      <input type="hidden" name="id" value={questionId} />
      <Button type="submit" size="sm" variant="ghost">
        <Archive />
        أرشفة
      </Button>
    </form>
  );
}
