import { IRouteableComponent, Parameters } from '@aurelia/router';
import guidesJson from '../../wiki-data/guides.json';

interface IWikiPage { title: string; content: string; }

export class WikiGuide implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.guide as string;
    this.page = (guidesJson as Record<string, IWikiPage>)[slug] || null;
  }
}
