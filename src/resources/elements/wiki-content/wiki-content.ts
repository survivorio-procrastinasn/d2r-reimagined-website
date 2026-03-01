import { bindable, ICustomElementViewModel } from 'aurelia';
import { applyGameTermHighlighting } from '../../../utilities/game-term-highlight';

interface ITocEntry {
    id: string;
    text: string;
    level: number;
}

export class WikiContent implements ICustomElementViewModel {
    @bindable title: string = '';
    @bindable content: string = '';

    tocEntries: ITocEntry[] = [];

    private contentRef: HTMLElement | null = null;

    attached() {
        this.processContent();
    }

    propertyChanged(name: string) {
        if (name === 'content') {
            queueMicrotask(() => this.processContent());
        }
    }

    scrollTo(id: string) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    private processContent() {
        if (!this.contentRef) return;
        this.buildToc();
        applyGameTermHighlighting(this.contentRef);
    }

    private buildToc() {
        if (!this.contentRef) return;
        const headings = this.contentRef.querySelectorAll<HTMLElement>('h1, h2, h3');
        const entries: ITocEntry[] = [];

        headings.forEach((heading, i) => {
            const text = heading.textContent?.trim() || '';
            if (!text) return;

            // Generate a stable id from the text
            const id = 'section-' + text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                || `section-${i}`;

            heading.id = id;

            entries.push({
                id,
                text,
                level: parseInt(heading.tagName.charAt(1), 10),
            });
        });

        this.tocEntries = entries;
    }
}
