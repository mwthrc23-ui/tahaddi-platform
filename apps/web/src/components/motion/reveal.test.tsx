import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Reveal } from './reveal';

describe('Reveal', () => {
  it('يرسل المحتوى المهم ظاهرًا في أول HTML قبل تشغيل JavaScript', () => {
    const markup = renderToStaticMarkup(
      <Reveal eager>
        <h1>الجولة تبدأ الآن</h1>
      </Reveal>,
    );

    expect(markup).toContain('opacity:1');
    expect(markup).not.toContain('opacity:0');
    expect(markup).toContain('الجولة تبدأ الآن');
  });
});
