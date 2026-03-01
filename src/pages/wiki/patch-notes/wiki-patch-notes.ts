import patchNotesJson from '../../wiki-data/patch-notes.json';

interface IPatchNote { slug: string; title: string; content: string; }
interface IPatchData { index: { title: string; content: string } | null; notes: IPatchNote[]; }

export class WikiPatchNotes {
  notes: IPatchNote[] = (patchNotesJson as IPatchData).notes;
}
