import { IRouteableComponent, Parameters } from '@aurelia/router';
import patchNotesJson from '../../wiki-data/patch-notes.json';

interface IPatchNote { slug: string; title: string; content: string; }
interface IPatchData { index: { title: string; content: string } | null; notes: IPatchNote[]; }

export class WikiPatchNoteDetail implements IRouteableComponent {
  page: IPatchNote | null = null;

  loading(params: Parameters) {
    const slug = params.version as string;
    this.page = (patchNotesJson as IPatchData).notes.find(n => n.slug === slug) || null;
  }
}
